import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ref as dbRef, onValue, off, update, set, get, push, serverTimestamp } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from './auth'

export const useQuizStore = defineStore('quiz', () => {
  const authStore = useAuthStore()
  const currentRoom = ref(null)
  const participants = ref({})
  const myAnswers = ref({})
  const myResult = ref(null)
  const leaderboard = ref([])
  const roomStatus = ref('waiting') // waiting | running | finished
  const timeLeft = ref(0)
  const currentQuestionIndex = ref(0)
  const violations = ref(0)
  let timerInterval = null
  let roomListener = null
  let participantsListener = null

  const questions = computed(() => currentRoom.value?.questionsList || [])
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || null)
  const totalQuestions = computed(() => questions.value.length)
  const answeredCount = computed(() => Object.keys(myAnswers.value).length)
  const progress = computed(() => totalQuestions.value ? (answeredCount.value / totalQuestions.value) * 100 : 0)

  async function joinRoom(roomId, uid) {
    const roomSnap = await get(dbRef(db, 'rooms/' + roomId))
    if (!roomSnap.exists()) throw new Error('Room tidak ditemukan.')
    const roomData = roomSnap.val()
    if (roomData.status === 'finished') throw new Error('Quiz sudah selesai.')

    // Load questions detail
    const qIds = roomData.questions || []
    const qPromises = qIds.map(id => get(dbRef(db, 'questions/' + id)))
    const qSnaps = await Promise.all(qPromises)
    const questionsList = qSnaps.map(s => s.val()).filter(Boolean)

    // Shuffle if needed
    if (roomData.shuffleQuestions) questionsList.sort(() => Math.random() - 0.5)
    if (roomData.shuffleOptions) {
      questionsList.forEach(q => {
        if (q.options) q.options.sort(() => Math.random() - 0.5)
      })
    }

    currentRoom.value = { ...roomData, id: roomId, questionsList }
    roomStatus.value = roomData.status

    // Register participant
    await update(dbRef(db, 'rooms/' + roomId + '/participants/' + uid), {
      uid, joinedAt: Date.now(), status: 'waiting', progress: 0, violations: 0
    })

    // Listen to room status changes
    roomListener = onValue(dbRef(db, 'rooms/' + roomId + '/status'), snap => {
      roomStatus.value = snap.val()
      if (snap.val() === 'running' && roomData.mode === 'host_controlled') {
        startTimer()
      }
    })

    // Listen to leaderboard
    participantsListener = onValue(dbRef(db, 'results/' + roomId), snap => {
      if (!snap.exists()) return
      const data = snap.val()
      leaderboard.value = Object.values(data)
        .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
        .map((r, i) => ({ ...r, rank: i + 1 }))
    })

    // Free-start mode: start immediately
    if (roomData.mode === 'free_start' && roomData.status === 'running') {
      startTimer()
    }

    return roomData
  }

  function startTimer() {
    if (!currentRoom.value) return
    const config = currentRoom.value.timerConfig
    if (!config) return
    if (config.type === 'total' || config.type === 'both') {
      timeLeft.value = config.totalSeconds
      timerInterval = setInterval(() => {
        timeLeft.value--
        if (timeLeft.value <= 0) { clearInterval(timerInterval); submitAll() }
      }, 1000)
    }
  }

  function startQuestionTimer(seconds) {
    clearInterval(timerInterval)
    timeLeft.value = seconds
    timerInterval = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        clearInterval(timerInterval)
        nextQuestion()
      }
    }, 1000)
  }

  function saveAnswer(questionId, answer) {
    myAnswers.value[questionId] = answer
    // Persist to Firebase
    const uid = authStore.user?.uid
    const roomId = currentRoom.value?.id
    if (uid && roomId) {
      update(dbRef(db, 'rooms/' + roomId + '/participants/' + uid), {
        progress: answeredCount.value,
        lastActivity: Date.now()
      })
    }
  }

  function nextQuestion() {
    if (currentQuestionIndex.value < totalQuestions.value - 1) {
      currentQuestionIndex.value++
      const q = currentQuestion.value
      if (q?.timerSeconds && currentRoom.value?.timerConfig?.type === 'per_question') {
        startQuestionTimer(q.timerSeconds)
      }
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex.value > 0) currentQuestionIndex.value--
  }

  function goToQuestion(index) {
    if (index >= 0 && index < totalQuestions.value) currentQuestionIndex.value = index
  }

  function recordViolation(type) {
    violations.value++
    const uid = authStore.user?.uid
    const roomId = currentRoom.value?.id
    if (uid && roomId) {
      update(dbRef(db, 'rooms/' + roomId + '/participants/' + uid), {
        violations: violations.value,
        lastViolation: { type, at: Date.now() }
      })
    }
  }

  async function submitAll() {
    clearInterval(timerInterval)
    const uid = authStore.user?.uid
    const roomId = currentRoom.value?.id
    if (!uid || !roomId) return

    const startTime = currentRoom.value?.startedAt || Date.now()
    const timeTaken = Math.floor((Date.now() - startTime) / 1000)

    // Calculate score client-side (Cloud Functions will recalculate server-side)
    let score = 0
    const questions = currentRoom.value?.questionsList || []
    questions.forEach(q => {
      const answer = myAnswers.value[q.id]
      if (!answer) return
      if (q.type === 'single') {
        if (answer === q.correctAnswers[0]) score += (q.points || 10)
      } else if (q.type === 'multiple') {
        const correct = new Set(q.correctAnswers)
        const given = new Set(Array.isArray(answer) ? answer : [answer])
        if (correct.size === given.size && [...correct].every(c => given.has(c))) {
          score += (q.points || 10)
        }
      }
    })

    const resultData = {
      uid, roomId, score, timeTaken, violations: violations.value,
      answers: myAnswers.value, submittedAt: Date.now(), rank: 0
    }

    await set(dbRef(db, 'results/' + roomId + '/' + uid), resultData)
    await update(dbRef(db, 'rooms/' + roomId + '/participants/' + uid), {
      status: 'submitted', score, submittedAt: Date.now()
    })

    myResult.value = resultData
    return resultData
  }

  function cleanup() {
    clearInterval(timerInterval)
    if (roomListener) off(dbRef(db, 'rooms/' + currentRoom.value?.id + '/status'), roomListener)
    if (participantsListener) off(dbRef(db, 'results/' + currentRoom.value?.id), participantsListener)
    currentRoom.value = null
    myAnswers.value = {}
    currentQuestionIndex.value = 0
    violations.value = 0
    timeLeft.value = 0
  }

  return {
    currentRoom, participants, myAnswers, myResult, leaderboard,
    roomStatus, timeLeft, currentQuestionIndex, violations,
    questions, currentQuestion, totalQuestions, answeredCount, progress,
    joinRoom, saveAnswer, nextQuestion, prevQuestion, goToQuestion,
    recordViolation, submitAll, startTimer, startQuestionTimer, cleanup
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ref as dbRef, onValue, off, update, set, get } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from './auth'

export const useQuizStore = defineStore('quiz', () => {
  const authStore = useAuthStore()

  // State
  const room = ref(null)           // data room lengkap
  const questions = ref([])        // array soal (sudah di-shuffle kalau perlu)
  const answers = ref({})          // { [questionId]: answer }
  const currentIndex = ref(0)      // index soal aktif
  const roomStatus = ref('waiting')
  const leaderboard = ref([])
  const participants = ref({})
  const violations = ref(0)
  const startedAt = ref(null)
  const submitted = ref(false)
  const myResult = ref(null)

  // Timer state
  const totalTimeLeft = ref(0)
  const questionTimeLeft = ref(0)
  let totalTimerInterval = null
  let questionTimerInterval = null

  // Firebase listeners
  let statusListener = null
  let leaderboardListener = null

  // Computed
  const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
  const totalQuestions = computed(() => questions.value.length)
  const answeredCount = computed(() => Object.keys(answers.value).length)
  const progress = computed(() => totalQuestions.value ? (answeredCount.value / totalQuestions.value) * 100 : 0)
  const unansweredCount = computed(() => totalQuestions.value - answeredCount.value)

  const timerConfig = computed(() => room.value?.timerConfig || { type: 'none' })
  const hasTotalTimer = computed(() => ['total', 'both'].includes(timerConfig.value?.type))
  const hasQuestionTimer = computed(() => ['per_question', 'both'].includes(timerConfig.value?.type))

  // Apakah jawaban soal ini sudah ada
  function getAnswer(questionId) {
    return answers.value[questionId] ?? null
  }

  function isOptionSelected(questionId, optionId) {
    const ans = answers.value[questionId]
    if (ans === null || ans === undefined) return false
    if (Array.isArray(ans)) return ans.includes(optionId)
    return ans === optionId
  }

  // Simpan jawaban
  function selectAnswer(questionId, optionId, type) {
    if (submitted.value) return

    if (type === 'single') {
      // Toggle: kalau sudah dipilih, unselect
      if (answers.value[questionId] === optionId) {
        answers.value = { ...answers.value, [questionId]: null }
      } else {
        answers.value = { ...answers.value, [questionId]: optionId }
      }
    } else if (type === 'multiple') {
      const current = Array.isArray(answers.value[questionId]) ? [...answers.value[questionId]] : []
      const idx = current.indexOf(optionId)
      if (idx >= 0) current.splice(idx, 1)
      else current.push(optionId)
      answers.value = { ...answers.value, [questionId]: current }
    }

    // Persist ke Firebase secara realtime
    persistAnswer(questionId)
  }

  function setEssayAnswer(questionId, text) {
    if (submitted.value) return
    answers.value = { ...answers.value, [questionId]: text }
    persistAnswer(questionId)
  }

  async function persistAnswer(questionId) {
    const uid = authStore.user?.uid
    const roomId = room.value?.id
    if (!uid || !roomId) return
    try {
      await update(dbRef(db, `sessions/${roomId}/${uid}/answers`), {
        [questionId]: answers.value[questionId] ?? null
      })
      await update(dbRef(db, `rooms/${roomId}/participants/${uid}`), {
        progress: answeredCount.value,
        lastActivity: Date.now()
      })
    } catch (e) { console.warn('Persist answer error:', e) }
  }

  // Navigasi
  function goTo(index) {
    if (index < 0 || index >= totalQuestions.value) return
    currentIndex.value = index
    // Reset question timer saat pindah soal
    if (hasQuestionTimer.value) startQuestionTimer()
  }

  function next() { goTo(currentIndex.value + 1) }
  function prev() { goTo(currentIndex.value - 1) }

  // Record violation
  function recordViolation(type) {
    violations.value++
    const uid = authStore.user?.uid
    const roomId = room.value?.id
    if (!uid || !roomId) return
    update(dbRef(db, `rooms/${roomId}/participants/${uid}`), {
      violations: violations.value,
      lastViolation: { type, at: Date.now() }
    }).catch(() => {})
  }

  // Timer total
  function startTotalTimer() {
    if (!hasTotalTimer.value) return
    clearInterval(totalTimerInterval)
    const totalSec = timerConfig.value.totalSeconds || 0
    if (!totalSec) return
    totalTimeLeft.value = totalSec
    totalTimerInterval = setInterval(() => {
      totalTimeLeft.value--
      if (totalTimeLeft.value <= 0) {
        clearInterval(totalTimerInterval)
        submitQuiz()
      }
    }, 1000)
  }

  // Timer per soal
  function startQuestionTimer() {
    if (!hasQuestionTimer.value) return
    clearInterval(questionTimerInterval)
    const q = currentQuestion.value
    const sec = q?.timerSeconds || timerConfig.value.perQuestionSeconds || 0
    if (!sec) return
    questionTimeLeft.value = sec
    questionTimerInterval = setInterval(() => {
      questionTimeLeft.value--
      if (questionTimeLeft.value <= 0) {
        clearInterval(questionTimerInterval)
        // Auto next soal atau auto submit kalau soal terakhir
        if (currentIndex.value < totalQuestions.value - 1) {
          next()
        } else {
          submitQuiz()
        }
      }
    }, 1000)
  }

  // Load session tersimpan (restore answers kalau reload)
  async function loadSavedSession(roomId, uid) {
    try {
      const snap = await get(dbRef(db, `sessions/${roomId}/${uid}/answers`))
      if (snap.exists()) {
        const saved = snap.val()
        // Merge: hanya isi yang belum ada di answers
        Object.entries(saved).forEach(([qId, ans]) => {
          if (ans !== null && ans !== undefined) {
            answers.value[qId] = ans
          }
        })
      }
    } catch (e) { console.warn('Load session error:', e) }
  }

  // Join room
  async function joinRoom(roomId) {
    const uid = authStore.user?.uid
    if (!uid) throw new Error('Harus login dulu.')

    // Load room data
    const roomSnap = await get(dbRef(db, `rooms/${roomId}`))
    if (!roomSnap.exists()) throw new Error('Room tidak ditemukan.')
    const roomData = roomSnap.val()

    if (roomData.status === 'finished') throw new Error('Quiz sudah selesai.')

    // Load soal
    const qIds = roomData.questions || []
    if (!qIds.length) throw new Error('Room ini belum punya soal.')

    const qSnaps = await Promise.all(qIds.map(id => get(dbRef(db, `questions/${id}`))))
    let loadedQuestions = qSnaps
      .map((s, i) => s.exists() ? { id: qIds[i], ...s.val() } : null)
      .filter(Boolean)

    // Shuffle soal kalau perlu (konsisten per sesi via seed dari uid)
    if (roomData.shuffleQuestions) {
      loadedQuestions = seededShuffle(loadedQuestions, uid + roomId)
    }

    // Shuffle opsi jawaban
    if (roomData.shuffleOptions) {
      loadedQuestions = loadedQuestions.map(q => ({
        ...q,
        options: q.options ? seededShuffle([...q.options], uid + q.id) : q.options
      }))
    }

    room.value = { id: roomId, ...roomData }
    questions.value = loadedQuestions
    roomStatus.value = roomData.status
    currentIndex.value = 0
    violations.value = 0
    submitted.value = false

    // Restore jawaban tersimpan
    await loadSavedSession(roomId, uid)

    // Register participant
    await update(dbRef(db, `rooms/${roomId}/participants/${uid}`), {
      uid,
      joinedAt: Date.now(),
      status: 'waiting',
      progress: answeredCount.value,
      violations: 0
    })

    // Save urutan soal ke sesi (biar konsisten kalau reload)
    await update(dbRef(db, `sessions/${roomId}/${uid}`), {
      questionOrder: loadedQuestions.map(q => q.id),
      joinedAt: Date.now()
    })

    // Listen status room
    statusListener = onValue(dbRef(db, `rooms/${roomId}/status`), snap => {
      const newStatus = snap.val()
      roomStatus.value = newStatus
      if (newStatus === 'running') {
        startedAt.value = Date.now()
        update(dbRef(db, `rooms/${roomId}/participants/${uid}`), { status: 'working' }).catch(() => {})
        if (hasTotalTimer.value) startTotalTimer()
        if (hasQuestionTimer.value) startQuestionTimer()
      }
      if (newStatus === 'finished' && !submitted.value) {
        submitQuiz()
      }
    })

    // Kalau mode free_start & room sudah running
    if (roomData.mode === 'free_start' && roomData.status === 'running') {
      startedAt.value = Date.now()
      update(dbRef(db, `rooms/${roomId}/participants/${uid}`), { status: 'working' }).catch(() => {})
      if (hasTotalTimer.value) startTotalTimer()
      if (hasQuestionTimer.value) startQuestionTimer()
    }

    // Listen leaderboard
    leaderboardListener = onValue(dbRef(db, `results/${roomId}`), snap => {
      if (!snap.exists()) { leaderboard.value = []; return }
      leaderboard.value = Object.values(snap.val())
        .filter(r => r.score !== undefined)
        .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
        .map((r, i) => ({ ...r, rank: i + 1 }))
    })

    return roomData
  }

  // Submit quiz
  async function submitQuiz() {
    if (submitted.value) return
    submitted.value = true

    clearInterval(totalTimerInterval)
    clearInterval(questionTimerInterval)

    const uid = authStore.user?.uid
    const roomId = room.value?.id
    if (!uid || !roomId) return

    const timeTaken = startedAt.value ? Math.floor((Date.now() - startedAt.value) / 1000) : 0

    // Hitung skor
    let score = 0
    questions.value.forEach(q => {
      const ans = answers.value[q.id]
      if (!ans) return
      const points = q.points || 10
      if (q.type === 'single') {
        if (ans === q.correctAnswers?.[0]) score += points
      } else if (q.type === 'multiple') {
        const correct = new Set(q.correctAnswers || [])
        const given = new Set(Array.isArray(ans) ? ans : [ans])
        if (correct.size > 0 && correct.size === given.size && [...correct].every(c => given.has(c))) {
          score += points
        }
      }
      // Essay tidak dihitung otomatis
    })

    const resultData = {
      uid, roomId, score, timeTaken,
      violations: violations.value,
      answers: answers.value,
      submittedAt: Date.now(),
      rank: 0
    }

    try {
      await set(dbRef(db, `results/${roomId}/${uid}`), resultData)
      await update(dbRef(db, `rooms/${roomId}/participants/${uid}`), {
        status: 'submitted', score, submittedAt: Date.now()
      })
      // Hapus sesi sementara
      await set(dbRef(db, `sessions/${roomId}/${uid}`), null)
      myResult.value = resultData
    } catch (e) {
      console.error('Submit error:', e)
      submitted.value = false
      throw e
    }

    return resultData
  }

  // Cleanup saat keluar
  function cleanup() {
    clearInterval(totalTimerInterval)
    clearInterval(questionTimerInterval)
    if (statusListener && room.value?.id) {
      off(dbRef(db, `rooms/${room.value.id}/status`))
    }
    if (leaderboardListener && room.value?.id) {
      off(dbRef(db, `results/${room.value.id}`))
    }
    room.value = null
    questions.value = []
    answers.value = {}
    currentIndex.value = 0
    roomStatus.value = 'waiting'
    leaderboard.value = []
    violations.value = 0
    submitted.value = false
    myResult.value = null
    startedAt.value = null
    totalTimeLeft.value = 0
    questionTimeLeft.value = 0
  }

  return {
    room, questions, answers, currentIndex, roomStatus,
    leaderboard, participants, violations, submitted, myResult,
    totalTimeLeft, questionTimeLeft,
    currentQuestion, totalQuestions, answeredCount, progress, unansweredCount,
    hasTotalTimer, hasQuestionTimer, timerConfig,
    getAnswer, isOptionSelected, selectAnswer, setEssayAnswer,
    goTo, next, prev, recordViolation,
    startTotalTimer, startQuestionTimer,
    joinRoom, submitQuiz, cleanup
  }
})

// Shuffle deterministik berdasarkan seed string (biar konsisten tiap reload)
function seededShuffle(arr, seed) {
  const a = [...arr]
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) | 0
    const j = Math.abs(h) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

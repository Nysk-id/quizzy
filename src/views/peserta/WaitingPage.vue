<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full space-y-4">

      <!-- Header card -->
      <div class="card p-6 text-center">
        <div class="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
          <span class="text-white font-bold text-2xl">Q</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900">{{ room?.title || 'Memuat...' }}</h1>
        <p class="text-gray-500 text-sm mt-1">{{ room?.eventTitle || '' }}</p>
      </div>

      <!-- Status card -->
      <div class="card p-6">
        <!-- Waiting -->
        <div v-if="roomStatus === 'waiting'" class="text-center">
          <div class="flex items-center justify-center gap-2 text-amber-600 mb-3">
            <div class="w-3 h-3 rounded-full bg-amber-500 animate-pulse-soft"></div>
            <span class="font-medium">Menunggu host memulai...</span>
          </div>
          <p class="text-sm text-gray-400 mb-6">Jangan tutup halaman ini. Quiz akan dimulai sebentar.</p>

          <!-- Room info -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Jumlah Soal</p>
              <p class="font-semibold text-gray-900">{{ room?.questions?.length || 0 }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Mode</p>
              <p class="font-semibold text-gray-900">{{ room?.mode === 'host_controlled' ? 'Host' : 'Free Start' }}</p>
            </div>
            <div class="bg-gray-50 rounded-xl p-3 col-span-2">
              <p class="text-xs text-gray-400 mb-0.5">Timer</p>
              <p class="font-semibold text-gray-900">{{ timerLabel }}</p>
            </div>
          </div>
        </div>

        <!-- Running / bisa mulai -->
        <div v-else-if="roomStatus === 'running'" class="text-center">
          <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="text-lg font-bold text-gray-900 mb-1">Quiz Dimulai!</p>
          <p class="text-gray-500 text-sm mb-5">Klik tombol di bawah untuk mulai mengerjakan.</p>
          <button @click="goToQuiz"
            class="w-full py-3 gradient-hero text-white font-medium rounded-xl hover:opacity-90 transition-opacity text-sm">
            Mulai Mengerjakan
          </button>
        </div>

        <!-- Finished -->
        <div v-else-if="roomStatus === 'finished'" class="text-center">
          <p class="text-gray-500 text-sm">Quiz sudah selesai.</p>
          <button @click="router.push('/dashboard')"
            class="mt-4 w-full py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Kembali ke Dashboard
          </button>
        </div>
      </div>

      <!-- Participants card -->
      <div class="card p-4">
        <p class="text-sm font-semibold text-gray-700 mb-3">
          Peserta sudah join
          <span class="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-bold">{{ participantList.length }}</span>
        </p>
        <div class="flex flex-wrap gap-2">
          <div v-for="p in participantList" :key="p.uid"
            :class="['flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              p.uid === authStore.user?.uid ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600']">
            <div class="w-1.5 h-1.5 rounded-full" :class="p.uid === authStore.user?.uid ? 'bg-primary-500' : 'bg-gray-400'"></div>
            {{ p.name || 'Peserta' }}
            <span v-if="p.uid === authStore.user?.uid" class="text-primary-500">(kamu)</span>
          </div>
        </div>
        <div v-if="!participantList.length" class="text-gray-400 text-xs">Belum ada peserta lain.</div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ref as dbRef, onValue, off, get } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useQuizStore } from '@/stores/quiz'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const quizStore = useQuizStore()

const roomId = route.params.roomId
const room = ref(null)
const roomStatus = ref('waiting')
const participantsData = ref({})
const usersCache = ref({})
const error = ref('')

let statusListener = null
let participantsListener = null

const participantList = computed(() => Object.values(participantsData.value).map(p => ({
  ...p, name: usersCache.value[p.uid]?.name || 'Peserta'
})))

const timerLabel = computed(() => {
  const cfg = room.value?.timerConfig
  if (!cfg || cfg.type === 'none') return 'Tidak ada timer'
  if (cfg.type === 'total') return `Total ${Math.round(cfg.totalSeconds / 60)} menit`
  if (cfg.type === 'per_question') return `${cfg.perQuestionSeconds} detik per soal`
  if (cfg.type === 'both') return `Total ${Math.round(cfg.totalSeconds / 60)} mnt + ${cfg.perQuestionSeconds}s/soal`
  return '-'
})

function goToQuiz() { router.push('/quiz/' + roomId) }

onMounted(async () => {
  const uid = authStore.user?.uid
  if (!uid) { router.push('/login'); return }

  try {
    await quizStore.joinRoom(roomId)
    room.value = quizStore.room
    roomStatus.value = quizStore.roomStatus

    // Kalau sudah running langsung masuk quiz
    if (quizStore.roomStatus === 'running') { goToQuiz(); return }

  } catch (e) {
    error.value = e.message
    setTimeout(() => router.push('/dashboard'), 2000)
    return
  }

  // Listen status
  statusListener = onValue(dbRef(db, `rooms/${roomId}/status`), snap => {
    const s = snap.val()
    roomStatus.value = s
    if (s === 'running') {
      // Kalau free_start langsung masuk
      if (room.value?.mode === 'free_start') goToQuiz()
    }
  })

  // Listen participants
  participantsListener = onValue(dbRef(db, `rooms/${roomId}/participants`), async snap => {
    if (!snap.exists()) return
    const data = snap.val()
    participantsData.value = data

    // Cache user data
    const unknownUids = Object.keys(data).filter(uid => !usersCache.value[uid])
    await Promise.all(unknownUids.map(async uid => {
      const s = await get(dbRef(db, `users/${uid}`))
      if (s.exists()) usersCache.value[uid] = s.val()
    }))
  })
})

onUnmounted(() => {
  if (statusListener) off(dbRef(db, `rooms/${roomId}/status`))
  if (participantsListener) off(dbRef(db, `rooms/${roomId}/participants`))
})
</script>

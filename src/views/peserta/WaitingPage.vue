<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-lg w-full animate-slide-up">
      <div class="card p-8 text-center">
        <!-- Header -->
        <div class="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
          <span class="text-white font-bold text-2xl">Q</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900 mb-1">{{ room?.title || 'Menunggu...' }}</h1>
        <p class="text-gray-500 text-sm mb-6">{{ room?.eventTitle }}</p>

        <!-- Status -->
        <div v-if="room?.status === 'waiting'" class="mb-8">
          <div class="flex items-center justify-center gap-3 bg-amber-50 text-amber-700 px-6 py-4 rounded-2xl mb-4">
            <div class="w-3 h-3 rounded-full bg-amber-500 animate-pulse-soft"></div>
            <span class="font-medium">Menunggu host memulai quiz...</span>
          </div>
          <p class="text-sm text-gray-400">Jangan tinggalkan halaman ini. Quiz akan dimulai sebentar lagi.</p>
        </div>
        <div v-else-if="room?.status === 'running'" class="mb-8">
          <div class="flex items-center justify-center gap-3 bg-green-50 text-green-700 px-6 py-4 rounded-2xl mb-4">
            <div class="w-3 h-3 rounded-full bg-green-500 animate-pulse-soft"></div>
            <span class="font-medium">Quiz sedang berlangsung!</span>
          </div>
          <AppButton variant="primary" size="lg" @click="goToQuiz">Mulai Mengerjakan</AppButton>
        </div>
        <div v-else-if="room?.status === 'finished'" class="mb-8">
          <div class="flex items-center justify-center gap-3 bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl">
            <span class="font-medium">Quiz sudah selesai.</span>
          </div>
        </div>

        <!-- Participants -->
        <div class="border-t border-gray-100 pt-6">
          <p class="text-sm font-medium text-gray-700 mb-3">Peserta sudah join ({{ participants.length }})</p>
          <div class="flex flex-wrap gap-2 justify-center">
            <div v-for="p in participants" :key="p.uid"
              :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium', p.uid === authStore.user?.uid ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600']">
              <div class="w-2 h-2 rounded-full" :class="p.uid === authStore.user?.uid ? 'bg-primary-500' : 'bg-gray-400'"></div>
              {{ p.name }}
            </div>
          </div>
        </div>

        <!-- Room info -->
        <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div class="bg-gray-50 rounded-xl p-3">
            <p class="text-gray-400 text-xs">Mode</p>
            <p class="font-medium text-gray-700 capitalize">{{ room?.mode === 'host_controlled' ? 'Host Controlled' : 'Free Start' }}</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-3">
            <p class="text-gray-400 text-xs">Jumlah Soal</p>
            <p class="font-medium text-gray-700">{{ room?.questions?.length || 0 }} soal</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ref as dbRef, onValue, off, get } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useQuizStore } from '@/stores/quiz'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute(); const router = useRouter()
const authStore = useAuthStore(); const quizStore = useQuizStore()
const roomId = route.params.roomId
const room = ref(null)
const participantsData = ref({})
const participants = computed(() => Object.values(participantsData.value))
let statusListener = null; let participantsListener = null

onMounted(async () => {
  const uid = authStore.user?.uid
  // Join room in store
  try { await quizStore.joinRoom(roomId, uid) } catch (e) { router.push('/dashboard'); return }
  room.value = quizStore.currentRoom

  // Listen status
  statusListener = onValue(dbRef(db, 'rooms/' + roomId + '/status'), snap => {
    if (room.value) room.value.status = snap.val()
    if (snap.val() === 'running' && room.value?.mode === 'free_start') goToQuiz()
  })

  // Listen participants
  participantsListener = onValue(dbRef(db, 'rooms/' + roomId + '/participants'), async snap => {
    if (!snap.exists()) return
    const data = snap.val()
    const enriched = await Promise.all(Object.values(data).map(async p => {
      const uSnap = await get(dbRef(db, 'users/' + p.uid))
      return { ...p, name: uSnap.val()?.name || 'Peserta' }
    }))
    participantsData.value = Object.fromEntries(enriched.map(p => [p.uid, p]))
  })
})

function goToQuiz() { router.push('/quiz/' + roomId) }

onUnmounted(() => {
  if (statusListener) off(dbRef(db, 'rooms/' + roomId + '/status'), statusListener)
  if (participantsListener) off(dbRef(db, 'rooms/' + roomId + '/participants'), participantsListener)
})
</script>

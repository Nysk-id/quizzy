<template>
  <PesertaLayout>
    <div class="space-y-8">
      <!-- Welcome -->
      <div class="gradient-hero rounded-2xl p-8 text-white">
        <h1 class="text-2xl font-bold mb-1">Halo, {{ authStore.displayName }}!</h1>
        <p class="opacity-80 text-sm">{{ authStore.profile?.nim }} • {{ authStore.profile?.prodi }}</p>
        <div class="mt-6 flex flex-col sm:flex-row gap-3">
          <AppButton variant="secondary" size="lg" @click="showJoin = true">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            Join dengan Kode
          </AppButton>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="card p-5 text-center">
          <p class="text-3xl font-bold text-primary-600">{{ historyCount }}</p>
          <p class="text-sm text-gray-500 mt-1">Quiz Diikuti</p>
        </div>
        <div class="card p-5 text-center">
          <p class="text-3xl font-bold text-green-600">{{ avgScore }}</p>
          <p class="text-sm text-gray-500 mt-1">Rata-rata Skor</p>
        </div>
        <div class="card p-5 text-center">
          <p class="text-3xl font-bold text-amber-600">{{ bestRank || '-' }}</p>
          <p class="text-sm text-gray-500 mt-1">Peringkat Terbaik</p>
        </div>
      </div>

      <!-- History -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Riwayat Quiz</h2>
        <div v-if="loadingHistory" class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-20 rounded-2xl" />
        </div>
        <div v-else-if="history.length" class="space-y-3">
          <div v-for="h in history" :key="h.roomId" class="card-hover p-4 flex items-center gap-4 cursor-pointer" @click="router.push('/result/' + h.roomId)">
            <div class="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{{ h.score }}</div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ h.roomTitle || 'Quiz' }}</p>
              <p class="text-xs text-gray-500">{{ formatDateTime(h.submittedAt) }} • Peringkat #{{ h.rank }}</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </div>
        </div>
        <div v-else class="card p-12 text-center text-gray-400">
          <p class="text-4xl mb-3">🎯</p>
          <p>Belum ada riwayat quiz. Join sekarang!</p>
        </div>
      </div>
    </div>

    <!-- Join Modal -->
    <AppModal v-model="showJoin" title="Join Quiz">
      <div class="space-y-4">
        <p class="text-sm text-gray-500">Masukkan kode room 6 digit dari panitia.</p>
        <AppInput v-model="joinCode" label="Kode Room" placeholder="Contoh: AB3C9D" class="uppercase" :error="joinError" />
        <AppButton variant="primary" size="lg" class="w-full" :loading="joinLoading" @click="handleJoin">Join Sekarang</AppButton>
      </div>
    </AppModal>
  </PesertaLayout>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ref as dbRef, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase'
import { formatDateTime } from '@/utils/helpers'
import PesertaLayout from '@/components/layout/PesertaLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'

const authStore = useAuthStore()
const router = useRouter()
const showJoin = ref(false)
const joinCode = ref('')
const joinError = ref('')
const joinLoading = ref(false)
const history = ref([])
const loadingHistory = ref(true)

const historyCount = computed(() => history.value.length)
const avgScore = computed(() => {
  if (!history.value.length) return 0
  return Math.round(history.value.reduce((s, h) => s + h.score, 0) / history.value.length)
})
const bestRank = computed(() => {
  if (!history.value.length) return null
  return Math.min(...history.value.map(h => h.rank || 999))
})

onMounted(async () => {
  const uid = authStore.user?.uid
  if (!uid) return
  try {
    const snap = await get(dbRef(db, 'users/' + uid + '/quizHistory'))
    if (snap.exists()) history.value = Object.values(snap.val()).sort((a, b) => b.submittedAt - a.submittedAt)
  } finally { loadingHistory.value = false }
})

async function handleJoin() {
  joinError.value = ''
  const code = joinCode.value.trim().toUpperCase()
  if (code.length !== 6) { joinError.value = 'Kode harus 6 karakter'; return }
  joinLoading.value = true
  try {
    // Find room by code
    const snap = await get(query(dbRef(db, 'room_codes'), orderByChild('code'), equalTo(code)))
    if (!snap.exists()) { joinError.value = 'Kode tidak ditemukan atau sudah kedaluwarsa'; return }
    const roomId = Object.keys(snap.val())[0]
    showJoin.value = false
    router.push('/waiting/' + roomId)
  } catch (e) { joinError.value = e.message }
  finally { joinLoading.value = false }
}
</script>

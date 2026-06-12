<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="max-w-md w-full">
      <div class="text-center mb-8">
        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center"><span class="text-white font-bold text-sm">Q</span></div>
          <span class="font-bold text-xl gradient-text">QuizZy</span>
        </div>
        <p class="text-gray-500 text-sm">Verifikasi Hasil Quiz</p>
      </div>
      <div class="card p-8 text-center">
        <div v-if="loading" class="py-8">
          <div class="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p class="text-gray-500">Memverifikasi...</p>
        </div>
        <div v-else-if="result" class="animate-fade-in">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-1">Hasil Terverifikasi</h2>
          <p class="text-green-600 text-sm mb-6">Dokumen ini asli dan tidak dimanipulasi</p>
          <div class="bg-gray-50 rounded-xl p-4 text-left space-y-3">
            <div class="flex justify-between"><span class="text-gray-500 text-sm">Nama</span><span class="font-medium text-sm">{{ result.name }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500 text-sm">NIM</span><span class="font-medium text-sm">{{ result.nim }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500 text-sm">Program Studi</span><span class="font-medium text-sm">{{ result.prodi }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500 text-sm">Skor</span><span class="font-bold text-primary-600 text-lg">{{ result.score }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500 text-sm">Event</span><span class="font-medium text-sm">{{ result.eventTitle }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500 text-sm">Waktu Submit</span><span class="font-medium text-sm">{{ formatDateTime(result.submittedAt) }}</span></div>
          </div>
        </div>
        <div v-else class="animate-fade-in">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-1">Verifikasi Gagal</h2>
          <p class="text-red-600 text-sm">Hash tidak ditemukan atau dokumen telah dimanipulasi.</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ref as dbRef, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase'
import { formatDateTime } from '@/utils/helpers'
const route = useRoute()
const hash = route.params.hash
const loading = ref(true)
const result = ref(null)

onMounted(async () => {
  // Search for result by hash
  try {
    const hashSnap = await get(dbRef(db, 'result_hashes/' + hash))
    if (!hashSnap.exists()) { loading.value = false; return }
    const { uid, roomId } = hashSnap.val()
    const [resultSnap, userSnap, roomSnap] = await Promise.all([
      get(dbRef(db, 'results/' + roomId + '/' + uid)),
      get(dbRef(db, 'users/' + uid)),
      get(dbRef(db, 'rooms/' + roomId))
    ])
    if (!resultSnap.exists()) { loading.value = false; return }
    const r = resultSnap.val(); const u = userSnap.val() || {}; const room = roomSnap.val() || {}
    result.value = { ...r, name: u.name, nim: u.nim, prodi: u.prodi, eventTitle: room.title || 'QuizZy' }
  } finally { loading.value = false }
})
</script>

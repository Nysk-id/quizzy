<template>
  <PesertaLayout>
    <div class="max-w-2xl mx-auto space-y-6">
      <div v-if="loading" class="space-y-4">
        <div class="skeleton h-48 rounded-2xl"/>
        <div class="skeleton h-32 rounded-2xl"/>
      </div>
      <div v-else-if="result" class="animate-slide-up">
        <!-- Score card -->
        <div id="result-card" class="gradient-hero rounded-2xl p-8 text-white text-center">
          <p class="text-sm opacity-70 mb-1">{{ result.eventTitle }}</p>
          <h2 class="text-lg font-semibold mb-6">{{ result.roomTitle }}</h2>
          <div class="text-7xl font-bold mb-2">{{ result.score }}</div>
          <p class="text-lg opacity-80 mb-6">poin</p>
          <div class="grid grid-cols-3 gap-4 bg-white/10 rounded-xl p-4">
            <div><p class="text-2xl font-bold">#{{ result.rank || '?' }}</p><p class="text-xs opacity-70">Peringkat</p></div>
            <div><p class="text-2xl font-bold">{{ result.answeredCount || 0 }}</p><p class="text-xs opacity-70">Dijawab</p></div>
            <div><p class="text-2xl font-bold">{{ formatDuration(result.timeTaken) }}</p><p class="text-xs opacity-70">Waktu</p></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Download Hasil</h3>
          <div class="grid grid-cols-2 gap-3">
            <AppButton variant="primary" :loading="useResultComp.generating.value" @click="downloadPDF">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Download PDF
            </AppButton>
            <AppButton variant="secondary" :loading="useResultComp.generating.value" @click="downloadJPG">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Download JPG
            </AppButton>
          </div>
        </div>

        <!-- QR Verify info -->
        <div class="card p-4 flex items-center gap-4">
          <div class="w-16 h-16 flex-shrink-0">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Verifikasi" class="w-full h-full" />
            <div v-else class="skeleton w-16 h-16 rounded" />
          </div>
          <div>
            <p class="font-medium text-gray-900 text-sm">QR Verifikasi</p>
            <p class="text-xs text-gray-500">Scan QR ini untuk membuktikan keaslian hasil quiz kamu.</p>
          </div>
        </div>

        <!-- Answer review (if allowed) -->
        <div v-if="result.showAnswers && questions.length" class="card p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Review Jawaban</h3>
          <div class="space-y-4">
            <div v-for="(q, i) in questions" :key="q.id" class="border border-gray-100 rounded-xl p-4">
              <div class="flex items-start gap-2 mb-3">
                <span :class="['w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isCorrect(q) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                  {{ isCorrect(q) ? '✓' : '✗' }}
                </span>
                <p class="text-sm font-medium text-gray-800">{{ i+1 }}. {{ q.text }}</p>
              </div>
              <div v-if="q.type !== 'essay'" class="space-y-1 ml-8">
                <div v-for="opt in q.options" :key="opt.id" :class="['text-xs px-3 py-1.5 rounded-lg',
                  q.correctAnswers?.includes(opt.id) ? 'bg-green-50 text-green-700 font-medium' :
                  isAnswered(q.id, opt.id) ? 'bg-red-50 text-red-600' : 'text-gray-500']">
                  {{ opt.id }}. {{ opt.text }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <AppButton variant="secondary" class="flex-1" @click="router.push('/dashboard')">Kembali ke Dashboard</AppButton>
          <AppButton variant="primary" class="flex-1" @click="router.push('/leaderboard/' + roomId)">Lihat Leaderboard</AppButton>
        </div>
      </div>
      <div v-else class="card p-12 text-center text-gray-400">
        <p>Hasil tidak ditemukan.</p>
        <AppButton variant="secondary" class="mt-4" @click="router.push('/dashboard')">Kembali</AppButton>
      </div>
    </div>
  </PesertaLayout>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useResult } from '@/composables/useResult'
import { formatDuration, formatDateTime } from '@/utils/helpers'
import PesertaLayout from '@/components/layout/PesertaLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute(); const router = useRouter()
const authStore = useAuthStore()
const useResultComp = useResult()
const roomId = route.params.roomId
const result = ref(null); const questions = ref([]); const loading = ref(true); const qrDataUrl = ref(null)

onMounted(async () => {
  const uid = authStore.user?.uid
  try {
    const [resultSnap, roomSnap] = await Promise.all([
      get(dbRef(db, 'results/' + roomId + '/' + uid)),
      get(dbRef(db, 'rooms/' + roomId))
    ])
    if (!resultSnap.exists()) { loading.value = false; return }
    const r = resultSnap.val(); const room = roomSnap.val() || {}
    result.value = { ...r, roomTitle: room.title, eventTitle: room.eventTitle, showAnswers: room.showAnswerAfterSubmit, answeredCount: Object.keys(r.answers || {}).length }

    // Load questions
    if (room.showAnswerAfterSubmit && room.questions) {
      const qSnaps = await Promise.all(room.questions.map(id => get(dbRef(db, 'questions/' + id))))
      questions.value = qSnaps.map(s => s.val()).filter(Boolean)
    }

    // Generate QR
    qrDataUrl.value = await useResultComp.generateQRDataURL(uid, roomId, r.score, r.submittedAt)
  } finally { loading.value = false }
})

function isCorrect(q) {
  if (!result.value?.answers) return false
  const ans = result.value.answers[q.id]
  if (!ans) return false
  if (q.type === 'single') return ans === q.correctAnswers?.[0]
  if (q.type === 'multiple') {
    const c = new Set(q.correctAnswers); const g = new Set(Array.isArray(ans) ? ans : [ans])
    return c.size === g.size && [...c].every(x => g.has(x))
  }
  return false
}
function isAnswered(qId, optId) {
  const ans = result.value?.answers?.[qId]
  if (!ans) return false
  return Array.isArray(ans) ? ans.includes(optId) : ans === optId
}
async function downloadPDF() {
  await useResultComp.downloadResultPDF(result.value, authStore.profile, result.value.roomTitle, result.value.eventTitle)
}
async function downloadJPG() {
  await useResultComp.downloadResultImage('result-card', 'Hasil_Quiz_' + authStore.profile?.nim + '.jpg')
}
</script>

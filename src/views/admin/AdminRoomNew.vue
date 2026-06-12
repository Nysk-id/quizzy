<template>
  <AdminLayout page-title="Buat Room Baru">
    <div class="max-w-2xl">
      <div class="card p-8">
        <form @submit.prevent="handleCreate" class="space-y-6">
          <AppInput v-model="form.title" label="Nama Room/Sesi" placeholder="Contoh: Babak Penyisihan, Sesi Pagi" :error="errors.title" required />

          <div>
            <label class="label">Mode Quiz</label>
            <div class="grid grid-cols-2 gap-3">
              <label v-for="m in modes" :key="m.id" :class="['cursor-pointer rounded-xl border-2 p-4 transition-all', form.mode === m.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300']">
                <input type="radio" v-model="form.mode" :value="m.id" class="sr-only"/>
                <p class="font-semibold text-sm text-gray-900">{{ m.label }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ m.desc }}</p>
              </label>
            </div>
          </div>

          <div>
            <label class="label">Konfigurasi Timer</label>
            <div class="space-y-3">
              <select v-model="form.timerType" class="input">
                <option value="none">Tidak ada timer</option>
                <option value="total">Total waktu</option>
                <option value="per_question">Per soal</option>
                <option value="both">Keduanya</option>
              </select>
              <div v-if="form.timerType === 'total' || form.timerType === 'both'" class="grid grid-cols-2 gap-3">
                <AppInput v-model.number="form.totalMinutes" type="number" label="Total Waktu (menit)" placeholder="30" min="1" />
              </div>
              <div v-if="form.timerType === 'per_question' || form.timerType === 'both'">
                <AppInput v-model.number="form.perQuestionSeconds" type="number" label="Timer per soal (detik)" placeholder="60" min="5" />
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <label class="label">Pengaturan Soal</label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="form.shuffleQuestions" class="w-4 h-4 text-primary-600 rounded"/>
              <span class="text-sm text-gray-700">Acak urutan soal</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="form.shuffleOptions" class="w-4 h-4 text-primary-600 rounded"/>
              <span class="text-sm text-gray-700">Acak opsi jawaban</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="form.showLeaderboard" class="w-4 h-4 text-primary-600 rounded"/>
              <span class="text-sm text-gray-700">Tampilkan leaderboard real-time ke peserta</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="form.showAnswerAfterSubmit" class="w-4 h-4 text-primary-600 rounded"/>
              <span class="text-sm text-gray-700">Tampilkan pembahasan setelah submit</span>
            </label>
          </div>

          <div>
            <label class="label">Pilih Soal dari Bank Soal</label>
            <div v-if="loadingQuestions" class="skeleton h-32 rounded-xl"/>
            <div v-else-if="availableQuestions.length" class="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
              <label v-for="q in availableQuestions" :key="q.id" class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                <input type="checkbox" :value="q.id" v-model="form.questions" class="mt-0.5 w-4 h-4 text-primary-600 rounded flex-shrink-0"/>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-800 line-clamp-1">{{ q.text }}</p>
                  <p class="text-xs text-gray-400">{{ q.type }} • {{ q.points || 10 }} poin</p>
                </div>
              </label>
            </div>
            <div v-else class="bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm">
              Belum ada soal. <RouterLink to="/admin/questions" class="underline">Buat soal di Bank Soal</RouterLink> dulu.
            </div>
            <p class="text-xs text-gray-500 mt-2">{{ form.questions.length }} soal dipilih</p>
          </div>

          <AppAlert v-if="errors.general" type="error">{{ errors.general }}</AppAlert>
          <div class="flex gap-3">
            <AppButton type="button" variant="secondary" @click="router.back()">Batal</AppButton>
            <AppButton type="submit" variant="primary" :loading="loading">Buat Room</AppButton>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ref as dbRef, push, set, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { generateRoomCode } from '@/utils/helpers'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const route = useRoute(); const router = useRouter(); const authStore = useAuthStore()
const eventId = route.params.id; const loading = ref(false); const loadingQuestions = ref(true)
const availableQuestions = ref([])
const modes = [
  { id: 'host_controlled', label: 'Host Controlled', desc: 'Semua peserta mulai bareng saat host tekan Start' },
  { id: 'free_start', label: 'Free Start', desc: 'Peserta bisa mulai kapan saja dalam window waktu' }
]
const form = reactive({
  title: '', mode: 'host_controlled', timerType: 'total', totalMinutes: 30,
  perQuestionSeconds: 60, shuffleQuestions: false, shuffleOptions: false,
  showLeaderboard: true, showAnswerAfterSubmit: true, questions: []
})
const errors = reactive({ title: '', general: '' })

onMounted(async () => {
  const uid = authStore.user?.uid
  try {
    const snap = await get(query(dbRef(db, 'questions'), orderByChild('createdBy'), equalTo(uid)))
    if (snap.exists()) availableQuestions.value = Object.entries(snap.val()).map(([id, q]) => ({ id, ...q }))
  } finally { loadingQuestions.value = false }
})

async function handleCreate() {
  Object.keys(errors).forEach(k => errors[k] = '')
  if (!form.title) { errors.title = 'Nama room wajib diisi'; return }
  loading.value = true
  try {
    const code = generateRoomCode()
    const newRef = push(dbRef(db, 'rooms'))
    const roomData = {
      title: form.title, eventId, mode: form.mode, code, status: 'waiting',
      timerConfig: { type: form.timerType, totalSeconds: form.totalMinutes * 60, perQuestionSeconds: form.perQuestionSeconds },
      shuffleQuestions: form.shuffleQuestions, shuffleOptions: form.shuffleOptions,
      showLeaderboard: form.showLeaderboard, showAnswerAfterSubmit: form.showAnswerAfterSubmit,
      questions: form.questions, participants: {}, createdBy: authStore.user?.uid, createdAt: Date.now(), participantCount: 0
    }
    await set(newRef, roomData)
    // Register code index
    await set(dbRef(db, 'room_codes/' + newRef.key), { code, roomId: newRef.key, createdAt: Date.now() })
    router.push('/admin/events/' + eventId)
  } catch(e) { errors.general = e.message }
  finally { loading.value = false }
}
</script>

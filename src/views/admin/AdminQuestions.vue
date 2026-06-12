<template>
  <AdminLayout page-title="Bank Soal">
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <div class="relative flex-1 max-w-sm">
          <input v-model="search" placeholder="Cari soal..." class="input pl-10"/>
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div class="flex gap-2">
          <AppButton variant="secondary" @click="downloadTemplate">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Template Excel
          </AppButton>
          <AppButton variant="secondary" @click="$refs.importInput.click()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Import Excel
          </AppButton>
          <input ref="importInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleImport"/>
          <AppButton variant="primary" @click="showForm = true">+ Tambah Soal</AppButton>
        </div>
      </div>

      <!-- Import progress -->
      <AppAlert v-if="importStatus" :type="importStatus.type">{{ importStatus.message }}</AppAlert>

      <!-- Questions list -->
      <div v-if="loading" class="space-y-3"><div v-for="i in 5" :key="i" class="skeleton h-20 rounded-2xl"/></div>
      <div v-else-if="filtered.length" class="space-y-3">
        <div v-for="q in filtered" :key="q.id" class="card p-4 flex items-start gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <AppBadge :color="q.type === 'essay' ? 'purple' : 'primary'">{{ q.type }}</AppBadge>
              <span class="text-xs text-gray-400">{{ q.points || 10 }} poin</span>
              <span v-if="q.timerSeconds" class="text-xs text-gray-400">⏱ {{ q.timerSeconds }}s</span>
            </div>
            <p class="text-sm text-gray-800 line-clamp-2">{{ q.text }}</p>
            <div v-if="q.options?.length" class="flex flex-wrap gap-1 mt-2">
              <span v-for="opt in q.options" :key="opt.id" :class="['text-xs px-2 py-0.5 rounded-full', q.correctAnswers?.includes(opt.id) ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500']">{{ opt.id }}: {{ opt.text }}</span>
            </div>
          </div>
          <button @click="deleteQuestion(q.id)" class="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </div>
      <div v-else class="card p-16 text-center text-gray-400">
        <p class="text-4xl mb-3">📝</p>
        <p>Belum ada soal. Tambah manual atau import dari Excel.</p>
      </div>
    </div>

    <!-- Add question modal -->
    <AppModal v-model="showForm" title="Tambah Soal Baru" size="lg">
      <form @submit.prevent="handleAddQuestion" class="space-y-4">
        <div>
          <label class="label">Tipe Soal</label>
          <select v-model="qForm.type" class="input">
            <option value="single">Pilihan Ganda (Single)</option>
            <option value="multiple">Pilihan Ganda (Multiple)</option>
            <option value="essay">Essay / Short Answer</option>
          </select>
        </div>
        <div>
          <label class="label">Teks Soal</label>
          <textarea v-model="qForm.text" rows="3" class="input resize-none" placeholder="Tulis pertanyaan di sini..." required></textarea>
        </div>
        <div v-if="qForm.type !== 'essay'" class="space-y-2">
          <label class="label">Opsi Jawaban</label>
          <div v-for="(opt, i) in qForm.options" :key="i" class="flex items-center gap-2">
            <span class="w-6 text-sm font-bold text-gray-400">{{ opt.id }}.</span>
            <input v-model="opt.text" :placeholder="'Opsi ' + opt.id" class="input flex-1"/>
            <label class="flex items-center gap-1 text-sm text-green-600 cursor-pointer">
              <input type="checkbox" :value="opt.id" v-model="qForm.correctAnswers" :disabled="qForm.type === 'single' && qForm.correctAnswers.length > 0 && !qForm.correctAnswers.includes(opt.id)" class="w-4 h-4"/>
              Benar
            </label>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <AppInput v-model.number="qForm.points" type="number" label="Poin" placeholder="10" min="1"/>
          <AppInput v-model.number="qForm.timerSeconds" type="number" label="Timer per soal (detik, opsional)" placeholder="0" min="0"/>
        </div>
        <div class="flex gap-3 pt-2">
          <AppButton type="button" variant="secondary" @click="showForm = false">Batal</AppButton>
          <AppButton type="submit" variant="primary" :loading="saving">Simpan Soal</AppButton>
        </div>
      </form>
    </AppModal>
  </AdminLayout>
</template>
<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ref as dbRef, get, push, set, remove, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useExport } from '@/composables/useExport'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const authStore = useAuthStore()
const { generateExcelTemplate, parseExcelQuestions } = useExport()
const questions = ref([]); const loading = ref(true); const saving = ref(false)
const search = ref(''); const showForm = ref(false); const importStatus = ref(null)

const filtered = computed(() => questions.value.filter(q => q.text?.toLowerCase().includes(search.value.toLowerCase())))
const qForm = reactive({ type: 'single', text: '', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }], correctAnswers: [], points: 10, timerSeconds: 0 })

onMounted(async () => {
  const uid = authStore.user?.uid
  try {
    const snap = await get(query(dbRef(db, 'questions'), orderByChild('createdBy'), equalTo(uid)))
    if (snap.exists()) questions.value = Object.entries(snap.val()).map(([id, q]) => ({ id, ...q }))
  } finally { loading.value = false }
})

async function handleAddQuestion() {
  if (!qForm.text.trim()) return
  saving.value = true
  try {
    const newRef = push(dbRef(db, 'questions'))
    const data = { type: qForm.type, text: qForm.text, points: qForm.points, timerSeconds: qForm.timerSeconds || 0, createdBy: authStore.user?.uid, createdAt: Date.now() }
    if (qForm.type !== 'essay') { data.options = qForm.options.filter(o => o.text.trim()); data.correctAnswers = qForm.correctAnswers }
    await set(newRef, data)
    questions.value.unshift({ id: newRef.key, ...data })
    showForm.value = false
    Object.assign(qForm, { type: 'single', text: '', options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }], correctAnswers: [], points: 10, timerSeconds: 0 })
  } finally { saving.value = false }
}

async function deleteQuestion(id) {
  if (!confirm('Hapus soal ini?')) return
  await remove(dbRef(db, 'questions/' + id))
  questions.value = questions.value.filter(q => q.id !== id)
}

function downloadTemplate() { generateExcelTemplate() }

async function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  importStatus.value = { type: 'info', message: 'Memproses file...' }
  try {
    const parsed = await parseExcelQuestions(file)
    const uid = authStore.user?.uid
    const newQuestions = []
    for (const q of parsed) {
      const newRef = push(dbRef(db, 'questions'))
      await set(newRef, { ...q, createdBy: uid, createdAt: Date.now() })
      newQuestions.push({ id: newRef.key, ...q })
    }
    questions.value = [...newQuestions, ...questions.value]
    importStatus.value = { type: 'success', message: `Berhasil import ${parsed.length} soal!` }
    setTimeout(() => importStatus.value = null, 4000)
  } catch(err) {
    importStatus.value = { type: 'error', message: 'Gagal import: ' + err.message }
  }
  e.target.value = ''
}
</script>

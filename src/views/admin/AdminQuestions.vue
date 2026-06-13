<template>
  <AdminLayout page-title="Bank Soal">
    <div class="space-y-4">

      <!-- Actions bar -->
      <div class="flex gap-2">
        <div class="relative flex-1">
          <input v-model="search" placeholder="Cari soal..." class="input pl-9 text-sm"/>
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <button @click="showForm = true"
          class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span class="hidden sm:inline">Tambah</span>
        </button>
      </div>

      <!-- Import/template buttons -->
      <div class="flex gap-2">
        <button @click="downloadTemplate"
          class="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Template
        </button>
        <button @click="$refs.importInput.click()"
          class="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
          Import Excel
        </button>
        <input ref="importInput" type="file" accept=".xlsx,.xls" class="hidden" @change="handleImport"/>
      </div>

      <!-- Import status -->
      <div v-if="importStatus" :class="['flex items-center gap-2 px-4 py-3 rounded-xl text-sm',
        importStatus.type === 'success' ? 'bg-green-50 text-green-800' :
        importStatus.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800']">
        <span>{{ importStatus.message }}</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="skeleton h-24 rounded-2xl"/>
      </div>

      <!-- Questions list -->
      <div v-else-if="filtered.length" class="space-y-3">
        <div v-for="q in filtered" :key="q.id" class="card p-4">
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                <span :class="['badge text-xs', q.type === 'essay' ? 'bg-purple-100 text-purple-700' : 'bg-primary-100 text-primary-700']">
                  {{ q.type === 'single' ? 'PG Single' : q.type === 'multiple' ? 'PG Multiple' : 'Essay' }}
                </span>
                <span class="text-xs text-gray-400">{{ q.points || 10 }} poin</span>
                <span v-if="q.timerSeconds" class="text-xs text-gray-400">⏱ {{ q.timerSeconds }}s</span>
              </div>
              <p class="text-sm text-gray-800 line-clamp-2 mb-2">{{ q.text }}</p>
              <div v-if="q.options?.length" class="flex flex-wrap gap-1">
                <span v-for="opt in q.options" :key="opt.id"
                  :class="['text-xs px-2 py-0.5 rounded-full',
                    q.correctAnswers?.includes(opt.id) ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500']">
                  {{ opt.id }}: {{ opt.text?.substring(0, 20) }}{{ opt.text?.length > 20 ? '...' : '' }}
                </span>
              </div>
            </div>
            <button @click="deleteQuestion(q.id)" class="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="card p-12 text-center">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-gray-500 font-medium mb-1">Belum ada soal</p>
        <p class="text-gray-400 text-sm mb-4">Tambah manual atau import dari Excel</p>
        <button @click="showForm = true"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
          Tambah Soal Pertama
        </button>
      </div>

    </div>

    <!-- Add question modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showForm" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showForm = false"/>
          <div class="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl sm:rounded-t-2xl z-10">
              <h3 class="font-semibold text-gray-900">Tambah Soal Baru</h3>
              <button @click="showForm = false" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form @submit.prevent="handleAddQuestion" class="p-5 space-y-4">
              <div>
                <label class="label">Tipe Soal</label>
                <select v-model="qForm.type" class="input text-sm">
                  <option value="single">Pilihan Ganda (Single Answer)</option>
                  <option value="multiple">Pilihan Ganda (Multiple Answer)</option>
                  <option value="essay">Essay / Short Answer</option>
                </select>
              </div>
              <div>
                <label class="label">Pertanyaan</label>
                <textarea v-model="qForm.text" rows="3" class="input resize-none text-sm" placeholder="Tulis pertanyaan..." required></textarea>
              </div>
              <div v-if="qForm.type !== 'essay'" class="space-y-2">
                <label class="label">Opsi Jawaban</label>
                <div v-for="(opt, i) in qForm.options" :key="i" class="flex items-center gap-2">
                  <span class="w-5 text-xs font-bold text-gray-400 flex-shrink-0">{{ opt.id }}.</span>
                  <input v-model="opt.text" :placeholder="'Opsi ' + opt.id" class="input flex-1 text-sm py-2"/>
                  <label class="flex items-center gap-1 cursor-pointer flex-shrink-0">
                    <input type="checkbox" :value="opt.id" v-model="qForm.correctAnswers"
                      :disabled="qForm.type === 'single' && qForm.correctAnswers.length > 0 && !qForm.correctAnswers.includes(opt.id)"
                      class="w-4 h-4 text-green-600 rounded"/>
                    <span class="text-xs text-green-600">Benar</span>
                  </label>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Poin</label>
                  <input v-model.number="qForm.points" type="number" min="1" placeholder="10" class="input text-sm"/>
                </div>
                <div>
                  <label class="label">Timer (detik, 0 = tanpa timer)</label>
                  <input v-model.number="qForm.timerSeconds" type="number" min="0" placeholder="0" class="input text-sm"/>
                </div>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" @click="showForm = false" class="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Batal</button>
                <button type="submit" :disabled="saving"
                  class="flex-1 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  <svg v-if="saving" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  {{ saving ? 'Menyimpan...' : 'Simpan' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ref as dbRef, get, push, set, remove, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { useExport } from '@/composables/useExport'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const authStore = useAuthStore()
const { generateExcelTemplate, parseExcelQuestions } = useExport()
const questions = ref([])
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const showForm = ref(false)
const importStatus = ref(null)

const filtered = computed(() =>
  questions.value.filter(q => q.text?.toLowerCase().includes(search.value.toLowerCase()))
)

const qForm = reactive({
  type: 'single',
  text: '',
  options: [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }],
  correctAnswers: [],
  points: 10,
  timerSeconds: 0
})

onMounted(async () => {
  const uid = authStore.user?.uid
  try {
    const snap = await get(query(dbRef(db, 'questions'), orderByChild('createdBy'), equalTo(uid)))
    if (snap.exists()) questions.value = Object.entries(snap.val()).map(([id, q]) => ({ id, ...q }))
  } finally { loading.value = false }
})

function resetForm() {
  qForm.type = 'single'
  qForm.text = ''
  qForm.options = [{ id: 'A', text: '' }, { id: 'B', text: '' }, { id: 'C', text: '' }, { id: 'D', text: '' }]
  qForm.correctAnswers = []
  qForm.points = 10
  qForm.timerSeconds = 0
}

async function handleAddQuestion() {
  if (!qForm.text.trim()) return
  saving.value = true
  try {
    const newRef = push(dbRef(db, 'questions'))
    const data = {
      type: qForm.type,
      text: qForm.text,
      points: qForm.points || 10,
      timerSeconds: qForm.timerSeconds || 0,
      createdBy: authStore.user?.uid,
      createdAt: Date.now()
    }
    if (qForm.type !== 'essay') {
      data.options = qForm.options.filter(o => o.text.trim())
      data.correctAnswers = qForm.correctAnswers
    }
    await set(newRef, data)
    questions.value.unshift({ id: newRef.key, ...data })
    showForm.value = false
    resetForm()
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
  importStatus.value = { type: 'info', message: 'Memproses file Excel...' }
  try {
    const parsed = await parseExcelQuestions(file)
    const uid = authStore.user?.uid
    const newQs = []
    for (const q of parsed) {
      const newRef = push(dbRef(db, 'questions'))
      await set(newRef, { ...q, createdBy: uid, createdAt: Date.now() })
      newQs.push({ id: newRef.key, ...q })
    }
    questions.value = [...newQs, ...questions.value]
    importStatus.value = { type: 'success', message: `Berhasil import ${parsed.length} soal!` }
    setTimeout(() => importStatus.value = null, 4000)
  } catch (err) {
    importStatus.value = { type: 'error', message: 'Gagal import: ' + err.message }
  }
  e.target.value = ''
}
</script>

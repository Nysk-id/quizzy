<template>
  <AdminLayout :page-title="'Hasil: ' + (room?.title || '')">
    <div class="space-y-4">

      <!-- Summary stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-primary-600">{{ results.length }}</p>
          <p class="text-xs text-gray-500 mt-1">Peserta</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ avgScore }}</p>
          <p class="text-xs text-gray-500 mt-1">Rata-rata</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-amber-600">{{ maxScore }}</p>
          <p class="text-xs text-gray-500 mt-1">Tertinggi</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-red-600">{{ minScore }}</p>
          <p class="text-xs text-gray-500 mt-1">Terendah</p>
        </div>
      </div>

      <!-- Export -->
      <button @click="handleExport" :disabled="exporting || !results.length"
        class="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        {{ exporting ? 'Mengexport...' : 'Export Excel' }}
      </button>

      <!-- Results list -->
      <div class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100">
          <p class="font-semibold text-gray-900 text-sm">Rekap Nilai</p>
        </div>
        <div v-if="loading" class="p-4 space-y-3">
          <div v-for="i in 5" :key="i" class="skeleton h-16 rounded-xl"/>
        </div>
        <div v-else-if="sortedResults.length" class="divide-y divide-gray-50">
          <div v-for="(r, i) in sortedResults" :key="r.uid"
            :class="['px-4 py-3 flex items-center gap-3', i < 3 ? 'bg-amber-50/40' : '']">
            <div class="w-8 text-center flex-shrink-0">
              <span v-if="i === 0" class="text-lg">🥇</span>
              <span v-else-if="i === 1" class="text-lg">🥈</span>
              <span v-else-if="i === 2" class="text-lg">🥉</span>
              <span v-else class="text-xs font-bold text-gray-400">#{{ i+1 }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ r.name }}</p>
              <p class="text-xs text-gray-400">{{ r.nim }} · {{ formatDuration(r.timeTaken) }}</p>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-lg font-bold text-primary-600">{{ r.score }}</p>
              <p v-if="r.violations > 0" class="text-xs text-red-500">⚠{{ r.violations }}</p>
            </div>
          </div>
        </div>
        <div v-else class="p-10 text-center text-gray-400 text-sm">
          Belum ada hasil.
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '@/firebase'
import { formatDuration } from '@/utils/helpers'
import { useExport } from '@/composables/useExport'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const route = useRoute()
const roomId = route.params.roomId
const { exportResultsToExcel } = useExport()
const room = ref(null)
const results = ref([])
const questions = ref([])
const loading = ref(true)
const exporting = ref(false)

const sortedResults = computed(() =>
  [...results.value].sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
)
const avgScore = computed(() =>
  results.value.length ? Math.round(results.value.reduce((s, r) => s + r.score, 0) / results.value.length) : 0
)
const maxScore = computed(() => results.value.length ? Math.max(...results.value.map(r => r.score)) : 0)
const minScore = computed(() => results.value.length ? Math.min(...results.value.map(r => r.score)) : 0)

function handleExport() {
  exporting.value = true
  try { exportResultsToExcel(sortedResults.value, questions.value, room.value?.title, room.value?.eventTitle) }
  finally { exporting.value = false }
}

onMounted(async () => {
  try {
    const [roomSnap, resultSnap] = await Promise.all([
      get(dbRef(db, 'rooms/' + roomId)),
      get(dbRef(db, 'results/' + roomId))
    ])
    if (roomSnap.exists()) room.value = roomSnap.val()
    if (resultSnap.exists()) {
      const data = resultSnap.val()
      const enriched = await Promise.all(Object.values(data).map(async r => {
        const uSnap = await get(dbRef(db, 'users/' + r.uid))
        const u = uSnap.val() || {}
        return { ...r, name: u.name, nim: u.nim, prodi: u.prodi }
      }))
      results.value = enriched
    }
    if (room.value?.questions) {
      const qSnaps = await Promise.all(room.value.questions.map(id => get(dbRef(db, 'questions/' + id))))
      questions.value = qSnaps.map(s => s.val()).filter(Boolean)
    }
  } finally { loading.value = false }
})
</script>

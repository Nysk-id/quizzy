<template>
  <AdminLayout :page-title="'Hasil: ' + (room?.title || '')">
    <div class="space-y-6">
      <!-- Summary -->
      <div class="grid grid-cols-4 gap-4">
        <div class="card p-4 text-center"><p class="text-2xl font-bold text-primary-600">{{ results.length }}</p><p class="text-xs text-gray-500 mt-1">Peserta</p></div>
        <div class="card p-4 text-center"><p class="text-2xl font-bold text-green-600">{{ avgScore }}</p><p class="text-xs text-gray-500 mt-1">Rata-rata</p></div>
        <div class="card p-4 text-center"><p class="text-2xl font-bold text-amber-600">{{ maxScore }}</p><p class="text-xs text-gray-500 mt-1">Tertinggi</p></div>
        <div class="card p-4 text-center"><p class="text-2xl font-bold text-red-600">{{ minScore }}</p><p class="text-xs text-gray-500 mt-1">Terendah</p></div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <AppButton variant="secondary" :loading="exporting" @click="handleExport">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Export Excel
        </AppButton>
      </div>

      <!-- Results table -->
      <div class="card overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100"><h3 class="font-semibold text-gray-900">Rekap Nilai</h3></div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">#</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Nama</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">NIM</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Prodi</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Skor</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Waktu</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Pelanggaran</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(r, i) in sortedResults" :key="r.uid" :class="i < 3 ? 'bg-amber-50/30' : ''">
                <td class="px-4 py-3 text-sm font-bold text-gray-500">{{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i+1) }}</td>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ r.name }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ r.nim }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ r.prodi }}</td>
                <td class="px-4 py-3 text-center font-bold text-primary-600">{{ r.score }}</td>
                <td class="px-4 py-3 text-center text-sm text-gray-500">{{ formatDuration(r.timeTaken) }}</td>
                <td class="px-4 py-3 text-center text-sm" :class="r.violations > 2 ? 'text-red-600 font-bold' : 'text-gray-500'">{{ r.violations || 0 }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!results.length" class="py-12 text-center text-gray-400 text-sm">Belum ada hasil.</div>
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
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute(); const roomId = route.params.roomId
const { exportResultsToExcel } = useExport()
const room = ref(null); const results = ref([]); const questions = ref([]); const exporting = ref(false)

const sortedResults = computed(() => [...results.value].sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken))
const avgScore = computed(() => results.value.length ? Math.round(results.value.reduce((s, r) => s + r.score, 0) / results.value.length) : 0)
const maxScore = computed(() => results.value.length ? Math.max(...results.value.map(r => r.score)) : 0)
const minScore = computed(() => results.value.length ? Math.min(...results.value.map(r => r.score)) : 0)

function handleExport() {
  exporting.value = true
  try { exportResultsToExcel(sortedResults.value, questions.value, room.value?.title, room.value?.eventTitle) }
  finally { exporting.value = false }
}

onMounted(async () => {
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
})
</script>

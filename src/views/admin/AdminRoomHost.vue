<template>
  <AdminLayout :page-title="room?.title || 'Host Panel'">
    <div v-if="loading" class="space-y-4"><div v-for="i in 3" :key="i" class="skeleton h-32 rounded-2xl"/></div>
    <div v-else-if="room" class="space-y-6">
      <!-- Control bar -->
      <div class="card p-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1">
            <h2 class="font-bold text-gray-900 text-lg">{{ room.title }}</h2>
            <p class="text-sm text-gray-500">Kode: <strong class="font-mono text-primary-600 text-lg tracking-widest">{{ room.code }}</strong></p>
          </div>
          <div class="flex items-center gap-3">
            <AppButton v-if="room.status === 'waiting'" variant="success" size="lg" :loading="actionLoading" @click="startQuiz">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Mulai Quiz
            </AppButton>
            <AppButton v-else-if="room.status === 'running'" variant="danger" size="lg" :loading="actionLoading" @click="stopQuiz">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
              Akhiri Quiz
            </AppButton>
            <AppBadge v-else color="gray">Selesai</AppBadge>
          </div>
        </div>
      </div>

      <!-- Live stats -->
      <div class="grid grid-cols-4 gap-4">
        <div class="card p-4 text-center">
          <p class="text-3xl font-bold text-primary-600">{{ participantsList.length }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Join</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-3xl font-bold text-amber-600">{{ workingCount }}</p>
          <p class="text-xs text-gray-500 mt-1">Sedang Mengerjakan</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-3xl font-bold text-green-600">{{ submittedCount }}</p>
          <p class="text-xs text-gray-500 mt-1">Sudah Submit</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-3xl font-bold text-red-600">{{ violationCount }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Pelanggaran</p>
        </div>
      </div>

      <!-- Participants table -->
      <div class="card overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">Monitor Peserta</h3>
          <span class="text-xs text-gray-400">Update real-time</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Nama</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">NIM</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Progress</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Pelanggaran</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500">Skor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="p in enrichedParticipants" :key="p.uid" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ p.name }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ p.nim }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 justify-center">
                    <div class="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-full bg-primary-500 transition-all" :style="{ width: progressPct(p) + '%' }"></div>
                    </div>
                    <span class="text-xs text-gray-500">{{ p.progress || 0 }}/{{ room.questions?.length || 0 }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <AppBadge :color="p.status === 'submitted' ? 'success' : p.status === 'working' ? 'primary' : 'warning'">{{ p.status }}</AppBadge>
                </td>
                <td class="px-4 py-3 text-center">
                  <span :class="p.violations > 2 ? 'text-red-600 font-bold' : 'text-gray-500'" class="text-sm">{{ p.violations || 0 }}</span>
                </td>
                <td class="px-4 py-3 text-center font-bold text-primary-600 text-sm">{{ results[p.uid]?.score ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!enrichedParticipants.length" class="py-12 text-center text-gray-400 text-sm">Belum ada peserta yang join.</div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ref as dbRef, onValue, off, get, update } from 'firebase/database'
import { db } from '@/firebase'
import { formatDuration } from '@/utils/helpers'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute(); const roomId = route.params.roomId
const room = ref(null); const loading = ref(true); const actionLoading = ref(false)
const participantsData = ref({}); const results = ref({}); const usersCache = ref({})
let participantListener = null; let resultListener = null

const participantsList = computed(() => Object.values(participantsData.value))
const submittedCount = computed(() => participantsList.value.filter(p => p.status === 'submitted').length)
const workingCount = computed(() => participantsList.value.filter(p => p.status === 'working').length)
const violationCount = computed(() => participantsList.value.reduce((s, p) => s + (p.violations || 0), 0))

const enrichedParticipants = computed(() =>
  participantsList.value.map(p => ({ ...p, ...usersCache.value[p.uid] }))
)

function progressPct(p) {
  const total = room.value?.questions?.length || 1
  return Math.round(((p.progress || 0) / total) * 100)
}

async function startQuiz() {
  actionLoading.value = true
  try { await update(dbRef(db, 'rooms/' + roomId), { status: 'running', startedAt: Date.now() }); room.value.status = 'running' }
  finally { actionLoading.value = false }
}
async function stopQuiz() {
  actionLoading.value = true
  try { await update(dbRef(db, 'rooms/' + roomId), { status: 'finished', finishedAt: Date.now() }); room.value.status = 'finished' }
  finally { actionLoading.value = false }
}

onMounted(async () => {
  const snap = await get(dbRef(db, 'rooms/' + roomId))
  if (snap.exists()) room.value = { id: roomId, ...snap.val() }
  loading.value = false

  participantListener = onValue(dbRef(db, 'rooms/' + roomId + '/participants'), async snap => {
    if (!snap.exists()) return
    const data = snap.val()
    participantsData.value = data
    // Enrich with user data
    await Promise.all(Object.keys(data).filter(uid => !usersCache.value[uid]).map(async uid => {
      const uSnap = await get(dbRef(db, 'users/' + uid))
      if (uSnap.exists()) usersCache.value[uid] = uSnap.val()
    }))
  })

  resultListener = onValue(dbRef(db, 'results/' + roomId), snap => {
    if (snap.exists()) results.value = snap.val()
  })
})

onUnmounted(() => {
  if (participantListener) off(dbRef(db, 'rooms/' + roomId + '/participants'), participantListener)
  if (resultListener) off(dbRef(db, 'results/' + roomId), resultListener)
})
</script>

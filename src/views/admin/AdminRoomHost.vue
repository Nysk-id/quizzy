<template>
  <AdminLayout :page-title="room?.title || 'Host Panel'">
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="skeleton h-24 rounded-2xl"/>
    </div>
    <div v-else-if="room" class="space-y-4">

      <!-- Control card -->
      <div class="card p-4">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 class="font-bold text-gray-900">{{ room.title }}</h2>
            <p class="text-sm text-gray-500 mt-0.5">
              Kode: <span class="font-mono font-bold text-primary-600 text-base tracking-widest">{{ room.code }}</span>
            </p>
          </div>
          <span :class="['badge text-xs flex-shrink-0',
            room.status === 'running' ? 'bg-green-100 text-green-700' :
            room.status === 'finished' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700']">
            {{ room.status }}
          </span>
        </div>
        <div class="flex gap-2">
          <button v-if="room.status === 'waiting'"
            @click="startQuiz" :disabled="actionLoading"
            class="flex-1 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            <svg v-if="actionLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
            Mulai Quiz
          </button>
          <button v-else-if="room.status === 'running'"
            @click="stopQuiz" :disabled="actionLoading"
            class="flex-1 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/></svg>
            Akhiri Quiz
          </button>
          <RouterLink :to="'/admin/rooms/' + roomId + '/results'"
            class="flex-shrink-0 px-4 py-3 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Hasil
          </RouterLink>
        </div>
      </div>

      <!-- Live stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-primary-600">{{ participantsList.length }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Join</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-green-600">{{ submittedCount }}</p>
          <p class="text-xs text-gray-500 mt-1">Sudah Submit</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-amber-600">{{ workingCount }}</p>
          <p class="text-xs text-gray-500 mt-1">Mengerjakan</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-bold text-red-600">{{ violationCount }}</p>
          <p class="text-xs text-gray-500 mt-1">Pelanggaran</p>
        </div>
      </div>

      <!-- Participants -->
      <div class="card overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p class="font-semibold text-gray-900 text-sm">Monitor Peserta</p>
          <span class="text-xs text-green-600 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft"></span>
            Live
          </span>
        </div>
        <div v-if="!enrichedParticipants.length" class="p-8 text-center text-gray-400 text-sm">
          Belum ada peserta yang join.
        </div>
        <div v-else class="divide-y divide-gray-50">
          <div v-for="p in enrichedParticipants" :key="p.uid" class="px-4 py-3">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span class="text-xs font-bold text-gray-500">{{ (p.name || 'P')[0] }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ p.name || 'Peserta' }}</p>
                <p class="text-xs text-gray-400">{{ p.nim }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-sm font-bold text-primary-600">{{ results[p.uid]?.score ?? '—' }}</p>
                <span :class="['text-xs px-2 py-0.5 rounded-full',
                  p.status === 'submitted' ? 'bg-green-100 text-green-700' :
                  p.status === 'working' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500']">
                  {{ p.status || 'waiting' }}
                </span>
              </div>
            </div>
            <!-- Progress bar -->
            <div class="flex items-center gap-2 ml-11">
              <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-primary-400 transition-all" :style="{ width: progressPct(p) + '%' }"></div>
              </div>
              <span class="text-xs text-gray-400 w-12 text-right">{{ p.progress || 0 }}/{{ room.questions?.length || 0 }}</span>
              <span v-if="p.violations > 0" class="text-xs text-red-500">⚠{{ p.violations }}</span>
            </div>
          </div>
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
import AdminLayout from '@/components/layout/AdminLayout.vue'

const route = useRoute()
const roomId = route.params.roomId
const room = ref(null)
const loading = ref(true)
const actionLoading = ref(false)
const participantsData = ref({})
const results = ref({})
const usersCache = ref({})
let participantListener = null
let resultListener = null

const participantsList = computed(() => Object.values(participantsData.value))
const submittedCount = computed(() => participantsList.value.filter(p => p.status === 'submitted').length)
const workingCount = computed(() => participantsList.value.filter(p => p.status === 'working').length)
const violationCount = computed(() => participantsList.value.reduce((s, p) => s + (p.violations || 0), 0))
const enrichedParticipants = computed(() =>
  participantsList.value.map(p => ({ ...p, ...usersCache.value[p.uid] }))
)

function progressPct(p) {
  const total = room.value?.questions?.length || 1
  return Math.min(100, Math.round(((p.progress || 0) / total) * 100))
}

async function startQuiz() {
  actionLoading.value = true
  try {
    await update(dbRef(db, 'rooms/' + roomId), { status: 'running', startedAt: Date.now() })
    room.value.status = 'running'
  } finally { actionLoading.value = false }
}

async function stopQuiz() {
  if (!confirm('Akhiri quiz sekarang? Semua peserta akan otomatis dikunci.')) return
  actionLoading.value = true
  try {
    await update(dbRef(db, 'rooms/' + roomId), { status: 'finished', finishedAt: Date.now() })
    room.value.status = 'finished'
  } finally { actionLoading.value = false }
}

onMounted(async () => {
  const snap = await get(dbRef(db, 'rooms/' + roomId))
  if (snap.exists()) room.value = { id: roomId, ...snap.val() }
  loading.value = false

  participantListener = onValue(dbRef(db, 'rooms/' + roomId + '/participants'), async snap => {
    if (!snap.exists()) return
    const data = snap.val()
    participantsData.value = data
    await Promise.all(
      Object.keys(data)
        .filter(uid => !usersCache.value[uid])
        .map(async uid => {
          const uSnap = await get(dbRef(db, 'users/' + uid))
          if (uSnap.exists()) usersCache.value[uid] = uSnap.val()
        })
    )
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

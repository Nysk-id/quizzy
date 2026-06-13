<template>
  <AdminLayout page-title="Dashboard">
    <div class="space-y-5">

      <!-- Welcome banner -->
      <div class="gradient-hero rounded-2xl p-5 text-white">
        <p class="text-sm opacity-80 mb-0.5">Selamat datang kembali,</p>
        <h2 class="text-xl font-bold">{{ authStore.displayName }}</h2>
        <p class="text-xs opacity-70 mt-1 capitalize">{{ authStore.profile?.role }} · QuizZy Admin Panel</p>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="card p-4">
          <p class="text-2xl font-bold text-primary-600">{{ stats.totalEvents }}</p>
          <p class="text-xs text-gray-500 mt-1">Total Event</p>
        </div>
        <div class="card p-4">
          <p class="text-2xl font-bold text-green-600">{{ stats.activeEvents }}</p>
          <p class="text-xs text-gray-500 mt-1">Event Aktif</p>
        </div>
        <div class="card p-4">
          <p class="text-2xl font-bold text-amber-600">{{ stats.activeRooms }}</p>
          <p class="text-xs text-gray-500 mt-1">Room Aktif</p>
        </div>
        <div class="card p-4">
          <p class="text-2xl font-bold text-purple-600">{{ stats.totalQuestions }}</p>
          <p class="text-xs text-gray-500 mt-1">Bank Soal</p>
        </div>
      </div>

      <!-- Quick actions -->
      <div>
        <p class="text-sm font-semibold text-gray-700 mb-3">Aksi Cepat</p>
        <div class="grid grid-cols-2 gap-3">
          <RouterLink to="/admin/events/new" class="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-shadow cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </div>
            <span class="text-sm font-medium text-gray-700">Buat Event</span>
          </RouterLink>
          <RouterLink to="/admin/questions" class="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-shadow cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <span class="text-sm font-medium text-gray-700">Tambah Soal</span>
          </RouterLink>
          <RouterLink to="/admin/events" class="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-shadow cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="text-sm font-medium text-gray-700">Kelola Event</span>
          </RouterLink>
          <RouterLink v-if="authStore.isSuperAdmin" to="/admin/users" class="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-shadow cursor-pointer">
            <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <span class="text-sm font-medium text-gray-700">Pengguna</span>
          </RouterLink>
        </div>
      </div>

      <!-- Active Rooms -->
      <div class="card">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p class="font-semibold text-gray-900 text-sm">Room Aktif</p>
          <RouterLink to="/admin/events" class="text-xs text-primary-600 hover:underline">Lihat semua</RouterLink>
        </div>
        <div v-if="loadingRooms" class="p-4 space-y-3">
          <div v-for="i in 2" :key="i" class="skeleton h-14 rounded-xl"/>
        </div>
        <div v-else-if="activeRooms.length" class="divide-y divide-gray-50">
          <div v-for="r in activeRooms" :key="r.id" class="p-4 flex items-center gap-3">
            <div class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse-soft flex-shrink-0"></div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 text-sm truncate">{{ r.title }}</p>
              <p class="text-xs text-gray-500">{{ r.participantCount || 0 }} peserta</p>
            </div>
            <RouterLink :to="'/admin/rooms/' + r.id + '/host'"
              class="flex-shrink-0 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
              Host
            </RouterLink>
          </div>
        </div>
        <div v-else class="p-8 text-center text-gray-400 text-sm">
          Tidak ada room yang sedang aktif.
        </div>
      </div>

      <!-- Recent Events -->
      <div class="card">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p class="font-semibold text-gray-900 text-sm">Event Terbaru</p>
          <RouterLink to="/admin/events/new"
            class="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Buat
          </RouterLink>
        </div>
        <div v-if="loadingEvents" class="p-4 space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-14 rounded-xl"/>
        </div>
        <div v-else-if="events.length" class="divide-y divide-gray-50">
          <div v-for="e in events.slice(0, 5)" :key="e.id" class="p-4 flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 text-sm truncate">{{ e.title }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(e.createdAt) }}</p>
            </div>
            <span :class="['badge text-xs', statusBadge(e.status)]">{{ e.status }}</span>
            <RouterLink :to="'/admin/events/' + e.id"
              class="flex-shrink-0 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Detail
            </RouterLink>
          </div>
        </div>
        <div v-else class="p-8 text-center">
          <p class="text-gray-400 text-sm mb-3">Belum ada event.</p>
          <RouterLink to="/admin/events/new"
            class="inline-flex items-center gap-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
            Buat Event Pertama
          </RouterLink>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ref as dbRef, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/helpers'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const authStore = useAuthStore()
const events = ref([])
const activeRooms = ref([])
const loadingEvents = ref(true)
const loadingRooms = ref(true)
const totalQuestions = ref(0)

const stats = computed(() => ({
  totalEvents: events.value.length,
  activeEvents: events.value.filter(e => e.status === 'active').length,
  activeRooms: activeRooms.value.length,
  totalQuestions: totalQuestions.value,
}))

function statusBadge(s) {
  return {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-amber-100 text-amber-700',
    finished: 'bg-gray-100 text-gray-500',
    archived: 'bg-gray-100 text-gray-400',
  }[s] || 'bg-gray-100 text-gray-500'
}

onMounted(async () => {
  const uid = authStore.user?.uid
  const isSa = authStore.isSuperAdmin

  // Events
  try {
    const snap = isSa
      ? await get(dbRef(db, 'events'))
      : await get(query(dbRef(db, 'events'), orderByChild('createdBy'), equalTo(uid)))
    if (snap.exists()) {
      events.value = Object.entries(snap.val())
        .map(([id, e]) => ({ id, ...e }))
        .sort((a, b) => b.createdAt - a.createdAt)
    }
  } finally { loadingEvents.value = false }

  // Active rooms
  try {
    const rSnap = await get(query(dbRef(db, 'rooms'), orderByChild('status'), equalTo('running')))
    if (rSnap.exists()) {
      activeRooms.value = Object.entries(rSnap.val()).map(([id, r]) => ({ id, ...r }))
    }
  } finally { loadingRooms.value = false }

  // Questions count
  try {
    const qSnap = await get(query(dbRef(db, 'questions'), orderByChild('createdBy'), equalTo(uid)))
    if (qSnap.exists()) totalQuestions.value = Object.keys(qSnap.val()).length
  } catch (e) {}
})
</script>

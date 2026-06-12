<template>
  <AdminLayout page-title="Dashboard">
    <div class="space-y-6">
      <!-- Stats -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="s in stats" :key="s.label" class="card p-5">
          <p class="text-2xl font-bold" :class="s.color">{{ s.value }}</p>
          <p class="text-sm text-gray-500 mt-1">{{ s.label }}</p>
        </div>
      </div>

      <!-- Active Rooms -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">Room Aktif</h2>
          <RouterLink to="/admin/events" class="text-sm text-primary-600 hover:underline">Lihat semua event</RouterLink>
        </div>
        <div v-if="loadingRooms" class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-16 rounded-xl"/>
        </div>
        <div v-else-if="activeRooms.length" class="space-y-3">
          <div v-for="r in activeRooms" :key="r.id" class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse-soft flex-shrink-0"></div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ r.title }}</p>
              <p class="text-xs text-gray-500">{{ r.participantCount || 0 }} peserta • {{ r.eventTitle }}</p>
            </div>
            <RouterLink :to="'/admin/rooms/' + r.id + '/host'" class="btn btn-primary btn-sm">Host</RouterLink>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-8">Tidak ada room yang sedang aktif.</div>
      </div>

      <!-- Recent Events -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">Event Terbaru</h2>
          <RouterLink to="/admin/events/new" class="btn btn-primary btn-sm">+ Buat Event</RouterLink>
        </div>
        <div v-if="loadingEvents" class="space-y-3"><div v-for="i in 3" :key="i" class="skeleton h-14 rounded-xl"/></div>
        <div v-else-if="events.length" class="divide-y divide-gray-50">
          <div v-for="e in events.slice(0,5)" :key="e.id" class="py-3 flex items-center gap-3">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ e.title }}</p>
              <p class="text-xs text-gray-500">{{ e.roomCount || 0 }} room • {{ formatDate(e.createdAt) }}</p>
            </div>
            <AppBadge :color="statusColor(e.status)">{{ e.status }}</AppBadge>
            <RouterLink :to="'/admin/events/' + e.id" class="btn btn-secondary btn-sm">Detail</RouterLink>
          </div>
        </div>
        <div v-else class="text-center text-gray-400 py-8">Belum ada event. <RouterLink to="/admin/events/new" class="text-primary-600">Buat sekarang</RouterLink></div>
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
import AppBadge from '@/components/ui/AppBadge.vue'

const authStore = useAuthStore()
const events = ref([]); const activeRooms = ref([])
const loadingEvents = ref(true); const loadingRooms = ref(true)
const totalParticipants = ref(0)

const stats = computed(() => [
  { label: 'Total Event', value: events.value.length, color: 'text-primary-600' },
  { label: 'Event Aktif', value: events.value.filter(e => e.status === 'active').length, color: 'text-green-600' },
  { label: 'Room Aktif', value: activeRooms.value.length, color: 'text-amber-600' },
  { label: 'Total Peserta', value: totalParticipants.value, color: 'text-purple-600' },
])

function statusColor(s) {
  return { active: 'success', finished: 'gray', draft: 'warning', archived: 'gray' }[s] || 'gray'
}

onMounted(async () => {
  const uid = authStore.user?.uid
  const isSa = authStore.isSuperAdmin
  try {
    const snap = isSa
      ? await get(dbRef(db, 'events'))
      : await get(query(dbRef(db, 'events'), orderByChild('createdBy'), equalTo(uid)))
    if (snap.exists()) {
      const data = snap.val()
      events.value = Object.entries(data).map(([id, e]) => ({ id, ...e })).sort((a, b) => b.createdAt - a.createdAt)
    }
  } finally { loadingEvents.value = false }

  // Active rooms
  try {
    const rSnap = await get(query(dbRef(db, 'rooms'), orderByChild('status'), equalTo('running')))
    if (rSnap.exists()) activeRooms.value = Object.entries(rSnap.val()).map(([id, r]) => ({ id, ...r }))
  } finally { loadingRooms.value = false }
})
</script>

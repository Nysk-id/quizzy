<template>
  <AdminLayout :page-title="event?.title || 'Detail Event'">
    <div v-if="loading" class="space-y-4"><div v-for="i in 3" :key="i" class="skeleton h-32 rounded-2xl"/></div>
    <div v-else-if="event" class="space-y-6">
      <!-- Header -->
      <div class="card p-6 flex items-start justify-between gap-4">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h2 class="text-xl font-bold text-gray-900">{{ event.title }}</h2>
            <AppBadge :color="statusColor(event.status)">{{ event.status }}</AppBadge>
          </div>
          <p class="text-gray-500 text-sm">{{ event.description }}</p>
          <p class="text-xs text-gray-400 mt-2">{{ formatDate(event.startDate) }} — {{ formatDate(event.endDate) }}</p>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <RouterLink :to="'/admin/events/' + eventId + '/rooms/new'" class="btn btn-primary btn-sm">+ Tambah Room</RouterLink>
        </div>
      </div>

      <!-- Rooms -->
      <div>
        <h3 class="font-semibold text-gray-900 mb-3">Room / Sesi ({{ rooms.length }})</h3>
        <div v-if="rooms.length" class="grid md:grid-cols-2 gap-4">
          <div v-for="r in rooms" :key="r.id" class="card p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-semibold text-gray-900">{{ r.title }}</h4>
                <p class="text-xs text-gray-500 mt-0.5">Kode: <strong class="text-primary-600 font-mono">{{ r.code }}</strong></p>
              </div>
              <AppBadge :color="r.status === 'running' ? 'success' : r.status === 'finished' ? 'gray' : 'warning'">{{ r.status }}</AppBadge>
            </div>
            <div class="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-4">
              <div><p class="font-medium text-gray-900">{{ r.questions?.length || 0 }}</p><p>Soal</p></div>
              <div><p class="font-medium text-gray-900 capitalize">{{ r.mode === 'host_controlled' ? 'Host' : 'Free' }}</p><p>Mode</p></div>
              <div><p class="font-medium text-gray-900">{{ r.participantCount || 0 }}</p><p>Peserta</p></div>
            </div>
            <div class="flex gap-2">
              <RouterLink :to="'/admin/rooms/' + r.id + '/host'" class="btn btn-primary btn-sm flex-1 justify-center">Host Panel</RouterLink>
              <RouterLink :to="'/admin/rooms/' + r.id + '/results'" class="btn btn-secondary btn-sm flex-1 justify-center">Hasil</RouterLink>
            </div>
          </div>
        </div>
        <div v-else class="card p-12 text-center text-gray-400">
          <p>Belum ada room. <RouterLink :to="'/admin/events/' + eventId + '/rooms/new'" class="text-primary-600">Tambah room pertama</RouterLink></p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ref as dbRef, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase'
import { formatDate } from '@/utils/helpers'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const route = useRoute()
const eventId = route.params.id
const event = ref(null); const rooms = ref([]); const loading = ref(true)
function statusColor(s) { return { active: 'success', finished: 'gray', draft: 'warning' }[s] || 'gray' }

onMounted(async () => {
  try {
    const [eSnap, rSnap] = await Promise.all([
      get(dbRef(db, 'events/' + eventId)),
      get(query(dbRef(db, 'rooms'), orderByChild('eventId'), equalTo(eventId)))
    ])
    if (eSnap.exists()) event.value = eSnap.val()
    if (rSnap.exists()) rooms.value = Object.entries(rSnap.val()).map(([id, r]) => ({ id, ...r }))
  } finally { loading.value = false }
})
</script>

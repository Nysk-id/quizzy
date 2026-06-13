<template>
  <AdminLayout :page-title="event?.title || 'Detail Event'">
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="skeleton h-28 rounded-2xl"/>
    </div>
    <div v-else-if="event" class="space-y-4">

      <!-- Event info card -->
      <div class="card p-4">
        <div class="flex items-start justify-between gap-3 mb-2">
          <h2 class="text-lg font-bold text-gray-900 leading-tight">{{ event.title }}</h2>
          <span :class="['badge text-xs flex-shrink-0', statusBadge(event.status)]">{{ event.status }}</span>
        </div>
        <p v-if="event.description" class="text-sm text-gray-500 mb-3">{{ event.description }}</p>
        <p class="text-xs text-gray-400">{{ formatDate(event.startDate) }} — {{ formatDate(event.endDate) }}</p>
        <div class="mt-3">
          <RouterLink :to="'/admin/events/' + eventId + '/rooms/new'"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Tambah Room
          </RouterLink>
        </div>
      </div>

      <!-- Rooms -->
      <div>
        <p class="text-sm font-semibold text-gray-700 mb-3">Room / Sesi ({{ rooms.length }})</p>
        <div v-if="rooms.length" class="space-y-3">
          <div v-for="r in rooms" :key="r.id" class="card p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex-1 min-w-0">
                <h4 class="font-semibold text-gray-900 truncate">{{ r.title }}</h4>
                <p class="text-xs font-mono text-primary-600 mt-0.5">Kode: <strong>{{ r.code }}</strong></p>
              </div>
              <span :class="['badge text-xs flex-shrink-0',
                r.status === 'running' ? 'bg-green-100 text-green-700' :
                r.status === 'finished' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700']">
                {{ r.status }}
              </span>
            </div>
            <div class="flex gap-3 text-xs text-gray-500 mb-3">
              <span>{{ r.questions?.length || 0 }} soal</span>
              <span>·</span>
              <span>{{ r.mode === 'host_controlled' ? 'Host Controlled' : 'Free Start' }}</span>
              <span>·</span>
              <span>{{ r.participantCount || 0 }} peserta</span>
            </div>
            <div class="flex gap-2">
              <RouterLink :to="'/admin/rooms/' + r.id + '/host'"
                class="flex-1 text-center py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
                Host Panel
              </RouterLink>
              <RouterLink :to="'/admin/rooms/' + r.id + '/results'"
                class="flex-1 text-center py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Hasil
              </RouterLink>
            </div>
          </div>
        </div>
        <div v-else class="card p-10 text-center">
          <p class="text-gray-400 text-sm mb-3">Belum ada room.</p>
          <RouterLink :to="'/admin/events/' + eventId + '/rooms/new'"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
            Tambah Room Pertama
          </RouterLink>
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

const route = useRoute()
const eventId = route.params.id
const event = ref(null)
const rooms = ref([])
const loading = ref(true)

function statusBadge(s) {
  return {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-amber-100 text-amber-700',
    finished: 'bg-gray-100 text-gray-500',
  }[s] || 'bg-gray-100 text-gray-500'
}

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

<template>
  <AdminLayout page-title="Events">
    <div class="space-y-4">
      <!-- Search + create -->
      <div class="flex gap-3">
        <div class="relative flex-1">
          <input v-model="search" placeholder="Cari event..." class="input pl-9 text-sm"/>
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <RouterLink to="/admin/events/new"
          class="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span class="hidden sm:inline">Buat Event</span>
          <span class="sm:hidden">Buat</span>
        </RouterLink>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="space-y-3">
        <div v-for="i in 4" :key="i" class="skeleton h-32 rounded-2xl"/>
      </div>

      <!-- Events list -->
      <div v-else-if="filtered.length" class="space-y-3">
        <div v-for="e in filtered" :key="e.id" class="card p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ e.title }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(e.createdAt) }}</p>
            </div>
            <span :class="['badge text-xs flex-shrink-0', statusBadge(e.status)]">{{ e.status }}</span>
          </div>
          <p v-if="e.description" class="text-sm text-gray-500 mb-3 line-clamp-2">{{ e.description }}</p>
          <div class="flex items-center gap-3 text-xs text-gray-400 mb-3">
            <span>{{ e.roomCount || 0 }} room</span>
            <span>·</span>
            <span>{{ e.totalParticipants || 0 }} peserta</span>
          </div>
          <div class="flex gap-2">
            <RouterLink :to="'/admin/events/' + e.id"
              class="flex-1 text-center py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Detail
            </RouterLink>
            <RouterLink :to="'/admin/events/' + e.id + '/rooms/new'"
              class="flex-1 text-center py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors">
              + Room
            </RouterLink>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else class="card p-12 text-center">
        <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        <p class="text-gray-500 font-medium mb-1">Belum ada event</p>
        <p class="text-gray-400 text-sm mb-4">Buat event pertama kamu sekarang</p>
        <RouterLink to="/admin/events/new"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
          Buat Event Pertama
        </RouterLink>
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
const loading = ref(true)
const search = ref('')

const filtered = computed(() =>
  events.value.filter(e => e.title?.toLowerCase().includes(search.value.toLowerCase()))
)

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
  try {
    const snap = isSa
      ? await get(dbRef(db, 'events'))
      : await get(query(dbRef(db, 'events'), orderByChild('createdBy'), equalTo(uid)))
    if (snap.exists()) {
      events.value = Object.entries(snap.val())
        .map(([id, e]) => ({ id, ...e }))
        .sort((a, b) => b.createdAt - a.createdAt)
    }
  } finally { loading.value = false }
})
</script>

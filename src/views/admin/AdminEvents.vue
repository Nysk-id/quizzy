<template>
  <AdminLayout page-title="Events">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="relative"><input v-model="search" placeholder="Cari event..." class="input pl-10 w-64" />
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <RouterLink to="/admin/events/new" class="btn btn-primary btn-md">+ Buat Event Baru</RouterLink>
      </div>

      <div v-if="loading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="skeleton h-48 rounded-2xl"/>
      </div>
      <div v-else-if="filtered.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="e in filtered" :key="e.id" class="card-hover p-6 flex flex-col gap-4">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ e.title }}</h3>
              <p class="text-xs text-gray-500 mt-0.5">{{ formatDate(e.createdAt) }}</p>
            </div>
            <AppBadge :color="statusColor(e.status)">{{ e.status }}</AppBadge>
          </div>
          <p class="text-sm text-gray-500 line-clamp-2 flex-1">{{ e.description || 'Tidak ada deskripsi.' }}</p>
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <span>{{ e.roomCount || 0 }} room</span>
            <span>•</span>
            <span>{{ e.totalParticipants || 0 }} peserta</span>
          </div>
          <div class="flex gap-2 pt-2 border-t border-gray-100">
            <RouterLink :to="'/admin/events/' + e.id" class="btn btn-secondary btn-sm flex-1 justify-center">Detail</RouterLink>
            <RouterLink :to="'/admin/events/' + e.id + '/rooms/new'" class="btn btn-primary btn-sm flex-1 justify-center">+ Room</RouterLink>
          </div>
        </div>
      </div>
      <div v-else class="card p-16 text-center text-gray-400">
        <p class="text-4xl mb-3">📅</p>
        <p class="font-medium">Belum ada event</p>
        <RouterLink to="/admin/events/new" class="btn btn-primary btn-md mt-4 inline-flex">Buat Event Pertama</RouterLink>
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
const events = ref([]); const loading = ref(true); const search = ref('')
const filtered = computed(() => events.value.filter(e => e.title?.toLowerCase().includes(search.value.toLowerCase())))
function statusColor(s) { return { active: 'success', finished: 'gray', draft: 'warning', archived: 'gray' }[s] || 'gray' }

onMounted(async () => {
  const uid = authStore.user?.uid; const isSa = authStore.isSuperAdmin
  try {
    const snap = isSa ? await get(dbRef(db, 'events')) : await get(query(dbRef(db, 'events'), orderByChild('createdBy'), equalTo(uid)))
    if (snap.exists()) events.value = Object.entries(snap.val()).map(([id, e]) => ({ id, ...e })).sort((a, b) => b.createdAt - a.createdAt)
  } finally { loading.value = false }
})
</script>

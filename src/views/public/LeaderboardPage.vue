<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-2xl mx-auto">
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center"><span class="text-white font-bold text-sm">Q</span></div>
          <span class="font-bold text-xl gradient-text">QuizZy</span>
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">{{ roomTitle }}</h1>
        <p class="text-gray-500 text-sm mt-1">Leaderboard Real-time</p>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 5" :key="i" class="skeleton h-16 rounded-2xl" />
      </div>

      <div v-else class="space-y-3">
        <TransitionGroup name="list" tag="div" class="space-y-3">
          <div v-for="(p, i) in leaderboard" :key="p.uid"
            :class="['card p-4 flex items-center gap-4', i < 3 ? 'border-primary-100' : '']">
            <div class="text-2xl w-10 text-center font-bold">
              <span v-if="i === 0">🥇</span>
              <span v-else-if="i === 1">🥈</span>
              <span v-else-if="i === 2">🥉</span>
              <span v-else class="text-gray-400 text-lg">#{{ i + 1 }}</span>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-gray-900">{{ p.name }}</p>
              <p class="text-xs text-gray-500">{{ p.nim }} • {{ p.prodi }}</p>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold text-primary-600">{{ p.score }}</p>
              <p class="text-xs text-gray-400">{{ formatDuration(p.timeTaken) }}</p>
            </div>
          </div>
        </TransitionGroup>
        <div v-if="!leaderboard.length" class="text-center text-gray-400 py-16">Belum ada peserta yang submit.</div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ref as dbRef, onValue, off, get } from 'firebase/database'
import { db } from '@/firebase'
import { formatDuration } from '@/utils/helpers'

const route = useRoute()
const roomId = route.params.roomId
const leaderboard = ref([])
const roomTitle = ref('Leaderboard')
const loading = ref(true)
let listener = null

onMounted(async () => {
  // Get room title
  const snap = await get(dbRef(db, 'rooms/' + roomId))
  if (snap.exists()) roomTitle.value = snap.val().title || 'Leaderboard'

  listener = onValue(dbRef(db, 'results/' + roomId), async snap => {
    loading.value = false
    if (!snap.exists()) { leaderboard.value = []; return }
    const data = snap.val()
    // Enrich with user data
    const entries = await Promise.all(Object.values(data).map(async r => {
      const uSnap = await get(dbRef(db, 'users/' + r.uid))
      const u = uSnap.val() || {}
      return { ...r, name: u.name || 'Peserta', nim: u.nim || '', prodi: u.prodi || '' }
    }))
    leaderboard.value = entries.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)
  })
})
onUnmounted(() => { if (listener) off(dbRef(db, 'results/' + roomId), listener) })
</script>
<style scoped>
.list-move, .list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from { opacity: 0; transform: translateX(-20px); }
.list-leave-to { opacity: 0; transform: translateX(20px); }
</style>

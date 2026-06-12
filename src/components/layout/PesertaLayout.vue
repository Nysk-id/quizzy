<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <RouterLink to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <span class="text-white font-bold text-sm">Q</span>
          </div>
          <span class="font-bold text-lg gradient-text">QuizZy</span>
        </RouterLink>
        <div class="flex items-center gap-3">
          <RouterLink to="/dashboard" class="text-sm text-gray-600 hover:text-primary-600 transition-colors">Dashboard</RouterLink>
          <RouterLink to="/profile" class="text-sm text-gray-600 hover:text-primary-600 transition-colors">Profil</RouterLink>
          <div class="w-8 h-8 rounded-full gradient-hero flex items-center justify-center cursor-pointer" @click="showMenu = !showMenu">
            <span class="text-white text-xs font-bold">{{ initials }}</span>
          </div>
          <div v-if="showMenu" class="absolute top-16 right-4 bg-white border border-gray-100 rounded-xl shadow-lg p-2 min-w-[160px] z-50">
            <div class="px-3 py-2 text-sm font-medium text-gray-900">{{ authStore.displayName }}</div>
            <div class="px-3 py-1 text-xs text-gray-500">{{ authStore.profile?.nim }}</div>
            <hr class="my-1 border-gray-100"/>
            <button @click="handleLogout" class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">Keluar</button>
          </div>
        </div>
      </div>
    </nav>
    <main class="max-w-6xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
const authStore = useAuthStore()
const router = useRouter()
const showMenu = ref(false)
const initials = computed(() => {
  const name = authStore.displayName
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})
async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

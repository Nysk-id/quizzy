<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-100 fixed h-full z-30 flex flex-col">
      <div class="p-5 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <span class="text-white font-bold text-sm">Q</span>
          </div>
          <div>
            <span class="font-bold text-sm gradient-text">QuizZy</span>
            <p class="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem to="/admin/dashboard" icon="grid">Dashboard</NavItem>
        <NavItem to="/admin/events" icon="calendar">Events</NavItem>
        <NavItem to="/admin/questions" icon="help-circle">Bank Soal</NavItem>
        <template v-if="authStore.isSuperAdmin">
          <div class="pt-2 pb-1 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Superadmin</div>
          <NavItem to="/admin/users" icon="users">Pengguna</NavItem>
          <NavItem to="/admin/settings" icon="settings">Pengaturan</NavItem>
        </template>
      </nav>
      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
            <span class="text-white text-xs font-bold">{{ initials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.displayName }}</p>
            <p class="text-xs text-gray-500 capitalize">{{ authStore.profile?.role }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="w-full text-sm text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg transition-colors text-left">Keluar</button>
      </div>
    </aside>
    <!-- Main -->
    <div class="ml-64 flex-1 flex flex-col min-h-screen">
      <header class="bg-white border-b border-gray-100 px-6 h-16 flex items-center sticky top-0 z-20">
        <slot name="header"><h1 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h1></slot>
      </header>
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, RouterLink } from 'vue-router'
const props = defineProps({ pageTitle: String })
const authStore = useAuthStore()
const router = useRouter()
const initials = computed(() => authStore.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())
async function handleLogout() { await authStore.logout(); router.push('/admin/login') }
</script>

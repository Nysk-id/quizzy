<template>
  <div class="min-h-screen bg-gray-50">

    <!-- Mobile top bar -->
    <header class="lg:hidden bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between sticky top-0 z-40">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg gradient-hero flex items-center justify-center">
          <span class="text-white font-bold text-xs">Q</span>
        </div>
        <span class="font-bold gradient-text">QuizZy</span>
        <span class="text-gray-400 text-xs">Admin</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600 font-medium">{{ pageTitle }}</span>
        <button @click="sidebarOpen = !sidebarOpen" class="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!sidebarOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Mobile sidebar overlay -->
    <Transition name="fade">
      <div v-if="sidebarOpen" class="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" @click="sidebarOpen = false"/>
    </Transition>

    <!-- Sidebar -->
    <aside :class="[
      'fixed top-0 left-0 h-full z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300',
      'lg:translate-x-0',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    ]">
      <!-- Logo (desktop only) -->
      <div class="hidden lg:flex p-5 border-b border-gray-100 items-center gap-2">
        <div class="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
          <span class="text-white font-bold text-sm">Q</span>
        </div>
        <div>
          <span class="font-bold text-sm gradient-text">QuizZy</span>
          <p class="text-xs text-gray-400">Admin Panel</p>
        </div>
      </div>

      <!-- Mobile sidebar header -->
      <div class="lg:hidden p-4 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
            <span class="text-white font-bold text-sm">Q</span>
          </div>
          <span class="font-bold gradient-text">QuizZy Admin</span>
        </div>
        <button @click="sidebarOpen = false" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem to="/admin/dashboard" icon="grid" @click="sidebarOpen = false">Dashboard</NavItem>
        <NavItem to="/admin/events" icon="calendar" @click="sidebarOpen = false">Events</NavItem>
        <NavItem to="/admin/questions" icon="help-circle" @click="sidebarOpen = false">Bank Soal</NavItem>
        <template v-if="authStore.isSuperAdmin">
          <div class="pt-3 pb-1 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Superadmin</div>
          <NavItem to="/admin/users" icon="users" @click="sidebarOpen = false">Pengguna</NavItem>
          <NavItem to="/admin/settings" icon="settings" @click="sidebarOpen = false">Pengaturan</NavItem>
        </template>
      </nav>

      <!-- User info -->
      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-9 h-9 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
            <span class="text-white text-xs font-bold">{{ initials }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.displayName }}</p>
            <p class="text-xs text-gray-500 capitalize">{{ authStore.profile?.role }}</p>
          </div>
        </div>
        <button @click="handleLogout" class="w-full text-sm text-red-600 hover:bg-red-50 py-2 px-3 rounded-lg transition-colors text-left flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Keluar
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="lg:ml-64 flex flex-col min-h-screen">
      <!-- Desktop header -->
      <header class="hidden lg:flex bg-white border-b border-gray-100 px-6 h-16 items-center sticky top-0 z-20">
        <slot name="header">
          <h1 class="text-lg font-semibold text-gray-900">{{ pageTitle }}</h1>
        </slot>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 lg:p-6">
        <slot />
      </main>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import NavItem from '@/components/layout/NavItem.vue'

defineProps({ pageTitle: String })

const authStore = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)

const initials = computed(() =>
  authStore.displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
)

async function handleLogout() {
  await authStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-sm animate-slide-up">
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-3"><span class="text-white font-bold text-xl">Q</span></div>
        <h1 class="text-xl font-bold text-white">Admin Panel</h1>
        <p class="text-gray-400 text-sm mt-1">QuizZy Management</p>
      </div>
      <div class="bg-gray-800 rounded-2xl p-8 border border-gray-700">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input v-model="email" type="email" placeholder="admin@quizzy.id" required
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input v-model="password" type="password" placeholder="••••••••" required
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all" />
          </div>
          <div v-if="error" class="flex items-center gap-2 text-red-400 text-sm bg-red-900/30 px-4 py-3 rounded-xl">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>
            {{ error }}
          </div>
          <button type="submit" :disabled="loading"
            class="w-full py-3 gradient-hero text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ loading ? 'Masuk...' : 'Masuk ke Admin Panel' }}
          </button>
        </form>
      </div>
      <p class="text-center text-gray-500 text-xs mt-4">Akun admin hanya bisa dibuat oleh superadmin.</p>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter(); const authStore = useAuthStore()
const email = ref(''); const password = ref(''); const loading = ref(false); const error = ref('')
async function handleLogin() {
  error.value = ''; loading.value = true
  try { await authStore.loginAdmin(email.value, password.value); router.push('/admin/dashboard') }
  catch(e) { error.value = e.message }
  finally { loading.value = false }
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md animate-slide-up">
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-3">
          <span class="text-white font-bold text-xl">Q</span>
        </div>
        <h1 class="text-xl font-bold text-white">Daftar sebagai Moderator</h1>
        <p class="text-gray-400 text-sm mt-1">Gunakan token undangan dari admin</p>
      </div>

      <div class="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <!-- Step 1: Verifikasi token -->
        <div v-if="step === 1" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Token Undangan</label>
            <input v-model="token" type="text" placeholder="Paste token dari admin..."
              class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-mono text-sm"/>
          </div>
          <div v-if="tokenError" class="text-red-400 text-sm bg-red-900/30 px-4 py-3 rounded-xl">{{ tokenError }}</div>
          <button @click="verifyToken" :disabled="loading || !token"
            class="w-full py-3 gradient-hero text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ loading ? 'Memverifikasi...' : 'Verifikasi Token' }}
          </button>
        </div>

        <!-- Step 2: Isi form -->
        <div v-if="step === 2" class="space-y-4">
          <div class="flex items-center gap-2 bg-green-900/30 text-green-400 px-4 py-3 rounded-xl text-sm mb-2">
            <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            Token valid! Role: <strong class="capitalize">{{ inviteData?.role }}</strong>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Nama Lengkap</label>
            <input v-model="form.name" placeholder="Nama kamu" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input v-model="form.email" type="email" placeholder="email@example.com" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Instansi / Universitas</label>
            <input v-model="form.instansi" placeholder="Contoh: UIN Walisongo Semarang" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Mata Kuliah / Bidang</label>
            <input v-model="form.matkul" placeholder="Contoh: Ekonomi Makro, Kalkulus" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"/>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input v-model="form.password" type="password" placeholder="Min. 6 karakter" class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"/>
          </div>
          <div v-if="formError" class="text-red-400 text-sm bg-red-900/30 px-4 py-3 rounded-xl">{{ formError }}</div>
          <button @click="handleRegister" :disabled="loading"
            class="w-full py-3 gradient-hero text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ loading ? 'Mendaftar...' : 'Buat Akun' }}
          </button>
        </div>

        <!-- Step 3: Sukses -->
        <div v-if="step === 3" class="text-center py-4">
          <div class="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h3 class="text-white font-bold text-lg mb-2">Akun berhasil dibuat!</h3>
          <p class="text-gray-400 text-sm mb-6">Mengalihkan ke admin panel...</p>
        </div>
      </div>

      <p class="text-center text-gray-500 text-xs mt-4">
        Sudah punya akun? <RouterLink to="/admin/login" class="text-primary-400 hover:underline">Masuk di sini</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const step = ref(1)
const token = ref('')
const tokenError = ref('')
const formError = ref('')
const loading = ref(false)
const inviteData = ref(null)
const form = reactive({ name: '', email: '', instansi: '', matkul: '', password: '' })

async function verifyToken() {
  tokenError.value = ''
  loading.value = true
  try {
    const snap = await get(dbRef(db, 'admin_invites/' + token.value.trim()))
    if (!snap.exists()) { tokenError.value = 'Token tidak ditemukan.'; return }
    const data = snap.val()
    if (data.used) { tokenError.value = 'Token sudah digunakan.'; return }
    if (data.expiresAt && Date.now() > data.expiresAt) { tokenError.value = 'Token sudah kedaluwarsa.'; return }
    inviteData.value = data
    step.value = 2
  } catch (e) { tokenError.value = e.message }
  finally { loading.value = false }
}

async function handleRegister() {
  formError.value = ''
  if (!form.name || !form.email || !form.password) { formError.value = 'Semua field wajib diisi.'; return }
  if (form.password.length < 6) { formError.value = 'Password minimal 6 karakter.'; return }
  loading.value = true
  try {
    await authStore.registerWithInvite({ token: token.value.trim(), ...form })
    step.value = 3
    setTimeout(() => router.push('/admin/dashboard'), 1500)
  } catch (e) { formError.value = e.message }
  finally { loading.value = false }
}
</script>

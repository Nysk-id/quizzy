<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md animate-slide-up">
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center gap-2 justify-center mb-4">
          <div class="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <span class="text-white font-bold">Q</span>
          </div>
          <span class="font-bold text-2xl gradient-text">QuizZy</span>
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Buat Akun Baru</h1>
        <p class="text-gray-500 text-sm mt-1">Gratis dan cepat, kurang dari 1 menit</p>
      </div>

      <div class="card p-8">
        <form @submit.prevent="handleRegister" class="space-y-4">
          <AppInput v-model="form.nim" label="NIM" placeholder="Masukkan NIM kamu" :error="errors.nim" required />
          <AppInput v-model="form.name" label="Nama Lengkap" placeholder="Nama sesuai KTM" :error="errors.name" required />
          <AppInput v-model="form.prodi" label="Program Studi" placeholder="Contoh: Teknik Informatika" :error="errors.prodi" required />

          <!-- Password -->
          <div>
            <label class="label">Password <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Minimal 6 karakter"
                class="input pr-10"
                :class="errors.password ? 'border-red-300 focus:ring-red-500' : ''"
                required
              />
              <button type="button" @click="showPass = !showPass" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="!showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path v-if="!showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  <path v-if="showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="label">Konfirmasi Password <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                v-model="form.confirmPassword"
                :type="showConfirm ? 'text' : 'password'"
                placeholder="Ulangi password"
                class="input pr-10"
                :class="errors.confirmPassword ? 'border-red-300 focus:ring-red-500' : ''"
                required
              />
              <button type="button" @click="showConfirm = !showConfirm" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-600">{{ errors.confirmPassword }}</p>
          </div>

          <!-- Error -->
          <div v-if="errors.general" class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-800">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div>
              <p class="font-medium">Pendaftaran gagal</p>
              <p class="mt-0.5 text-red-700">{{ errors.general }}</p>
              <p v-if="showFirebaseHelp" class="mt-2 text-red-600 text-xs">
                💡 Pastikan Firebase Authentication (Email/Password) sudah diaktifkan di Firebase Console → Authentication → Sign-in method.
              </p>
            </div>
          </div>

          <!-- Success -->
          <div v-if="success" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-green-50 text-green-800">
            <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Akun berhasil dibuat! Mengalihkan ke dashboard...</span>
          </div>

          <button
            type="submit"
            :disabled="loading || success"
            class="w-full py-3 px-4 gradient-hero text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else-if="success" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ loading ? 'Mendaftarkan...' : success ? 'Berhasil!' : 'Daftar Sekarang' }}
          </button>
        </form>

        <div class="mt-5 text-center text-sm text-gray-500">
          Sudah punya akun?
          <RouterLink to="/login" class="text-primary-600 font-medium hover:underline">Masuk</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppInput from '@/components/ui/AppInput.vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const success = ref(false)
const showPass = ref(false)
const showConfirm = ref(false)
const showFirebaseHelp = ref(false)

const form = reactive({ nim: '', name: '', prodi: '', password: '', confirmPassword: '' })
const errors = reactive({ nim: '', name: '', prodi: '', password: '', confirmPassword: '', general: '' })

async function handleRegister() {
  // Reset errors
  Object.keys(errors).forEach(k => errors[k] = '')
  showFirebaseHelp.value = false

  // Validasi
  let hasError = false
  if (!form.nim.trim()) { errors.nim = 'NIM wajib diisi'; hasError = true }
  if (!form.name.trim()) { errors.name = 'Nama lengkap wajib diisi'; hasError = true }
  if (!form.prodi.trim()) { errors.prodi = 'Program studi wajib diisi'; hasError = true }
  if (form.password.length < 6) { errors.password = 'Password minimal 6 karakter'; hasError = true }
  if (form.password !== form.confirmPassword) { errors.confirmPassword = 'Password tidak cocok'; hasError = true }
  if (hasError) return

  loading.value = true
  try {
    await authStore.registerWithNIM({
      nim: form.nim,
      name: form.name,
      prodi: form.prodi,
      password: form.password
    })
    success.value = true
    setTimeout(() => router.push('/dashboard'), 1500)
  } catch (e) {
    // Terjemahkan error Firebase ke bahasa Indonesia
    const code = e?.code || ''
    if (code === 'auth/email-already-in-use') {
      errors.general = 'NIM sudah terdaftar. Gunakan NIM lain atau langsung masuk.'
    } else if (code === 'auth/operation-not-allowed') {
      errors.general = 'Pendaftaran belum diaktifkan. Hubungi admin.'
      showFirebaseHelp.value = true
    } else if (code === 'auth/weak-password') {
      errors.general = 'Password terlalu lemah. Gunakan minimal 6 karakter.'
    } else if (code === 'auth/network-request-failed') {
      errors.general = 'Koneksi internet bermasalah. Coba lagi.'
    } else if (e.message === 'NIM sudah terdaftar.') {
      errors.general = 'NIM sudah terdaftar. Silakan masuk atau gunakan NIM lain.'
    } else {
      errors.general = e.message || 'Terjadi kesalahan. Coba lagi.'
    }
  } finally {
    loading.value = false
  }
}
</script>

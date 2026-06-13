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
        <h1 class="text-2xl font-bold text-gray-900">Masuk ke QuizZy</h1>
        <p class="text-gray-500 text-sm mt-1">Gunakan NIM atau akun Google kamu</p>
      </div>

      <div class="card p-8">
        <!-- Tabs -->
        <div class="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            v-for="t in tabs" :key="t.id"
            @click="activeTab = t.id; errors.general = ''"
            :class="['flex-1 py-2 text-sm font-medium rounded-lg transition-all', activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700']"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- NIM Login -->
        <form v-if="activeTab === 'nim'" @submit.prevent="handleNIMLogin" class="space-y-4">
          <AppInput v-model="nim" label="NIM" placeholder="Masukkan NIM kamu" :error="errors.nim" required />

          <div>
            <label class="label">Password <span class="text-red-500">*</span></label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPass ? 'text' : 'password'"
                placeholder="Password kamu"
                class="input pr-10"
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
          </div>

          <!-- Error -->
          <div v-if="errors.general" class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-800">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <span>{{ errors.general }}</span>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 gradient-hero text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Masuk...' : 'Masuk' }}
          </button>
        </form>

        <!-- Google Login -->
        <div v-if="activeTab === 'google'" class="space-y-4">
          <div v-if="errors.general" class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-800">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <span>{{ errors.general }}</span>
          </div>

          <button
            @click="handleGoogleLogin"
            :disabled="loading"
            class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50 text-sm"
          >
            <svg v-if="loading" class="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {{ loading ? 'Memproses...' : 'Lanjutkan dengan Google' }}
          </button>
          <p class="text-xs text-gray-400 text-center">Jika pertama kali login, kamu akan diminta melengkapi profil NIM.</p>
        </div>

        <div class="mt-6 text-center text-sm text-gray-500">
          Belum punya akun?
          <RouterLink to="/register" class="text-primary-600 font-medium hover:underline">Daftar sekarang</RouterLink>
        </div>
      </div>
    </div>

    <!-- Complete Profile Modal (Google SSO) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCompleteProfile" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scale-in">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">Lengkapi Profil</h3>
            <p class="text-sm text-gray-500 mb-5">
              Hai <strong>{{ googleUser?.displayName }}</strong>! Isi data berikut untuk melanjutkan.
            </p>
            <form @submit.prevent="handleCompleteProfile" class="space-y-4">
              <AppInput v-model="cpForm.nim" label="NIM" placeholder="Masukkan NIM kamu" :error="cpErrors.nim" required />
              <AppInput v-model="cpForm.prodi" label="Program Studi" placeholder="Contoh: Teknik Informatika" :error="cpErrors.prodi" required />
              <div v-if="cpErrors.general" class="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-4 py-3 rounded-xl">
                <span>{{ cpErrors.general }}</span>
              </div>
              <button
                type="submit"
                :disabled="cpLoading"
                class="w-full py-3 gradient-hero text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
              >
                <svg v-if="cpLoading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ cpLoading ? 'Menyimpan...' : 'Simpan & Lanjutkan' }}
              </button>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppInput from '@/components/ui/AppInput.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref('nim')
const tabs = [{ id: 'nim', label: 'NIM & Password' }, { id: 'google', label: 'Google' }]
const nim = ref('')
const password = ref('')
const showPass = ref(false)
const loading = ref(false)
const errors = reactive({ nim: '', general: '' })

const showCompleteProfile = ref(false)
const googleUser = ref(null)
const cpForm = reactive({ nim: '', prodi: '' })
const cpErrors = reactive({ nim: '', prodi: '', general: '' })
const cpLoading = ref(false)

async function handleNIMLogin() {
  Object.assign(errors, { nim: '', general: '' })
  if (!nim.value.trim()) { errors.nim = 'NIM wajib diisi'; return }
  if (!password.value) { errors.general = 'Password wajib diisi'; return }

  loading.value = true
  try {
    await authStore.loginWithNIM(nim.value, password.value)
    router.push(route.query.redirect || '/dashboard')
  } catch (e) {
    const code = e?.code || ''
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      errors.general = 'NIM atau password salah. Periksa kembali.'
    } else if (code === 'auth/too-many-requests') {
      errors.general = 'Terlalu banyak percobaan. Tunggu beberapa menit.'
    } else if (code === 'auth/network-request-failed') {
      errors.general = 'Koneksi internet bermasalah. Coba lagi.'
    } else {
      errors.general = e.message || 'Gagal masuk. Coba lagi.'
    }
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  errors.general = ''
  loading.value = true
  try {
    const res = await authStore.loginWithGoogle()
    if (res.needsProfile) {
      googleUser.value = res.user
      showCompleteProfile.value = true
    } else {
      router.push(route.query.redirect || '/dashboard')
    }
  } catch (e) {
    if (e?.code === 'auth/popup-closed-by-user') {
      errors.general = 'Popup ditutup. Coba lagi.'
    } else {
      errors.general = e.message || 'Gagal login dengan Google.'
    }
  } finally {
    loading.value = false
  }
}

async function handleCompleteProfile() {
  Object.assign(cpErrors, { nim: '', prodi: '', general: '' })
  if (!cpForm.nim.trim()) { cpErrors.nim = 'NIM wajib diisi'; return }
  if (!cpForm.prodi.trim()) { cpErrors.prodi = 'Prodi wajib diisi'; return }

  cpLoading.value = true
  try {
    await authStore.completeGoogleProfile({
      nim: cpForm.nim,
      name: googleUser.value.displayName,
      prodi: cpForm.prodi
    })
    showCompleteProfile.value = false
    router.push('/dashboard')
  } catch (e) {
    cpErrors.general = e.message || 'Gagal menyimpan profil.'
  } finally {
    cpLoading.value = false
  }
}
</script>

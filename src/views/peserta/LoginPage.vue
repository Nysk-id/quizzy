<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md animate-slide-up">
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center gap-2 justify-center mb-4">
          <div class="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center"><span class="text-white font-bold">Q</span></div>
          <span class="font-bold text-2xl gradient-text">QuizZy</span>
        </RouterLink>
        <h1 class="text-2xl font-bold text-gray-900">Masuk ke QuizZy</h1>
        <p class="text-gray-500 text-sm mt-1">Gunakan NIM atau akun Google kamu</p>
      </div>
      <div class="card p-8">
        <!-- Tabs -->
        <div class="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
            :class="['flex-1 py-2 text-sm font-medium rounded-lg transition-all', activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500']">
            {{ t.label }}
          </button>
        </div>

        <!-- NIM Login -->
        <form v-if="activeTab === 'nim'" @submit.prevent="handleNIMLogin" class="space-y-4">
          <AppInput v-model="nim" label="NIM" placeholder="Masukkan NIM kamu" :error="errors.nim" required />
          <div>
            <AppInput v-model="password" :type="showPass ? 'text' : 'password'" label="Password" placeholder="Password kamu" :error="errors.password" required>
              <template #suffix>
                <button type="button" @click="showPass = !showPass" class="text-gray-400 hover:text-gray-600">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path v-if="!showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path v-if="!showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    <path v-if="showPass" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                  </svg>
                </button>
              </template>
            </AppInput>
          </div>
          <AppAlert v-if="errors.general" type="error">{{ errors.general }}</AppAlert>
          <AppButton type="submit" variant="primary" size="lg" class="w-full" :loading="loading">Masuk</AppButton>
        </form>

        <!-- Google Login -->
        <div v-if="activeTab === 'google'" class="space-y-4">
          <AppAlert v-if="errors.general" type="error">{{ errors.general }}</AppAlert>
          <button @click="handleGoogleLogin" :disabled="loading"
            class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50">
            <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {{ loading ? 'Memproses...' : 'Lanjutkan dengan Google' }}
          </button>
          <p class="text-xs text-gray-400 text-center">Jika pertama kali login, kamu akan diminta melengkapi profil NIM.</p>
        </div>

        <div class="mt-6 text-center text-sm text-gray-500">
          Belum punya akun? <RouterLink to="/register" class="text-primary-600 font-medium hover:underline">Daftar sekarang</RouterLink>
        </div>
      </div>
    </div>

    <!-- Complete Profile Modal (Google SSO) -->
    <AppModal v-model="showCompleteProfile" title="Lengkapi Profil" :show-close="false">
      <form @submit.prevent="handleCompleteProfile" class="space-y-4">
        <p class="text-sm text-gray-500">Hai <strong>{{ googleUser?.displayName }}</strong>! Lengkapi data berikut untuk melanjutkan.</p>
        <AppInput v-model="cpForm.nim" label="NIM" placeholder="Masukkan NIM kamu" :error="cpErrors.nim" required />
        <AppInput v-model="cpForm.prodi" label="Program Studi" placeholder="Contoh: Teknik Informatika" :error="cpErrors.prodi" required />
        <AppAlert v-if="cpErrors.general" type="error">{{ cpErrors.general }}</AppAlert>
        <AppButton type="submit" variant="primary" size="lg" class="w-full" :loading="cpLoading">Simpan & Lanjutkan</AppButton>
      </form>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppModal from '@/components/ui/AppModal.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeTab = ref('nim')
const tabs = [{ id: 'nim', label: 'NIM & Password' }, { id: 'google', label: 'Google' }]
const nim = ref(''); const password = ref(''); const showPass = ref(false)
const loading = ref(false)
const errors = reactive({ nim: '', password: '', general: '' })

const showCompleteProfile = ref(false)
const googleUser = ref(null)
const cpForm = reactive({ nim: '', prodi: '' })
const cpErrors = reactive({ nim: '', prodi: '', general: '' })
const cpLoading = ref(false)

async function handleNIMLogin() {
  Object.assign(errors, { nim: '', password: '', general: '' })
  if (!nim.value) { errors.nim = 'NIM wajib diisi'; return }
  if (!password.value) { errors.password = 'Password wajib diisi'; return }
  loading.value = true
  try {
    await authStore.loginWithNIM(nim.value, password.value)
    router.push(route.query.redirect || '/dashboard')
  } catch (e) {
    errors.general = e.code === 'auth/invalid-credential' ? 'NIM atau password salah.' : e.message
  } finally { loading.value = false }
}

async function handleGoogleLogin() {
  errors.general = ''
  loading.value = true
  try {
    const res = await authStore.loginWithGoogle()
    if (res.needsProfile) { googleUser.value = res.user; showCompleteProfile.value = true }
    else router.push(route.query.redirect || '/dashboard')
  } catch (e) { errors.general = e.message }
  finally { loading.value = false }
}

async function handleCompleteProfile() {
  Object.assign(cpErrors, { nim: '', prodi: '', general: '' })
  if (!cpForm.nim) { cpErrors.nim = 'NIM wajib diisi'; return }
  if (!cpForm.prodi) { cpErrors.prodi = 'Prodi wajib diisi'; return }
  cpLoading.value = true
  try {
    await authStore.completeGoogleProfile({ nim: cpForm.nim, name: googleUser.value.displayName, prodi: cpForm.prodi })
    showCompleteProfile.value = false
    router.push('/dashboard')
  } catch (e) { cpErrors.general = e.message }
  finally { cpLoading.value = false }
}
</script>

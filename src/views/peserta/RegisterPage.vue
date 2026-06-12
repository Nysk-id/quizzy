<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md animate-slide-up">
      <div class="text-center mb-8">
        <RouterLink to="/" class="inline-flex items-center gap-2 justify-center mb-4">
          <div class="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center"><span class="text-white font-bold">Q</span></div>
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
          <AppInput v-model="form.password" type="password" label="Password" placeholder="Minimal 6 karakter" :error="errors.password" required />
          <AppInput v-model="form.confirmPassword" type="password" label="Konfirmasi Password" placeholder="Ulangi password" :error="errors.confirmPassword" required />
          <AppAlert v-if="errors.general" type="error">{{ errors.general }}</AppAlert>
          <AppAlert v-if="success" type="success">Akun berhasil dibuat! Mengalihkan...</AppAlert>
          <AppButton type="submit" variant="primary" size="lg" class="w-full" :loading="loading">Daftar Sekarang</AppButton>
        </form>
        <div class="mt-4 text-center text-sm text-gray-500">
          Sudah punya akun? <RouterLink to="/login" class="text-primary-600 font-medium hover:underline">Masuk</RouterLink>
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
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const success = ref(false)
const form = reactive({ nim: '', name: '', prodi: '', password: '', confirmPassword: '' })
const errors = reactive({ nim: '', name: '', prodi: '', password: '', confirmPassword: '', general: '' })

async function handleRegister() {
  Object.keys(errors).forEach(k => errors[k] = '')
  if (!form.nim) { errors.nim = 'NIM wajib diisi'; return }
  if (!form.name) { errors.name = 'Nama wajib diisi'; return }
  if (!form.prodi) { errors.prodi = 'Prodi wajib diisi'; return }
  if (form.password.length < 6) { errors.password = 'Password minimal 6 karakter'; return }
  if (form.password !== form.confirmPassword) { errors.confirmPassword = 'Password tidak cocok'; return }
  loading.value = true
  try {
    await authStore.registerWithNIM(form)
    success.value = true
    setTimeout(() => router.push('/dashboard'), 1200)
  } catch (e) { errors.general = e.message }
  finally { loading.value = false }
}
</script>

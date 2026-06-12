<template>
  <PesertaLayout>
    <div class="max-w-xl mx-auto space-y-6">
      <h1 class="text-xl font-bold text-gray-900">Profil Saya</h1>
      <div class="card p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center text-white font-bold text-2xl">{{ initials }}</div>
          <div>
            <h2 class="text-lg font-bold text-gray-900">{{ authStore.displayName }}</h2>
            <p class="text-gray-500 text-sm">{{ authStore.profile?.nim }}</p>
            <AppBadge color="primary" class="mt-1">{{ authStore.profile?.prodi }}</AppBadge>
          </div>
        </div>
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <AppInput v-model="form.name" label="Nama Lengkap" :error="errors.name" />
          <AppInput v-model="form.prodi" label="Program Studi" :error="errors.prodi" />
          <AppInput :model-value="authStore.profile?.nim" label="NIM" disabled hint="NIM tidak dapat diubah" />
          <AppAlert v-if="success" type="success">Profil berhasil diperbarui!</AppAlert>
          <AppAlert v-if="errors.general" type="error">{{ errors.general }}</AppAlert>
          <AppButton type="submit" variant="primary" :loading="loading">Simpan Perubahan</AppButton>
        </form>
      </div>
    </div>
  </PesertaLayout>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import PesertaLayout from '@/components/layout/PesertaLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
const authStore = useAuthStore()
const loading = ref(false); const success = ref(false)
const form = reactive({ name: '', prodi: '' })
const errors = reactive({ name: '', prodi: '', general: '' })
const initials = computed(() => authStore.displayName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase())
onMounted(() => { form.name = authStore.profile?.name || ''; form.prodi = authStore.profile?.prodi || '' })
async function handleUpdate() {
  Object.keys(errors).forEach(k => errors[k] = '')
  if (!form.name) { errors.name = 'Nama wajib diisi'; return }
  loading.value = true; success.value = false
  try { await authStore.updateProfile({ name: form.name, prodi: form.prodi }); success.value = true; setTimeout(() => success.value = false, 3000) }
  catch(e) { errors.general = e.message }
  finally { loading.value = false }
}
</script>

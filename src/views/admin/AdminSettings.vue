<template>
  <AdminLayout page-title="Pengaturan Global">
    <div class="max-w-xl space-y-6">
      <div class="card p-6">
        <h2 class="font-semibold text-gray-900 mb-4">Konfigurasi Platform</h2>
        <form @submit.prevent="handleSave" class="space-y-4">
          <AppInput v-model="settings.platformName" label="Nama Platform" placeholder="QuizZy"/>
          <AppInput v-model="settings.maxParticipantsPerRoom" type="number" label="Maks. Peserta per Room" placeholder="100"/>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="settings.registrationOpen" class="w-4 h-4 text-primary-600 rounded"/>
            <span class="text-sm text-gray-700">Registrasi peserta terbuka</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="settings.maintenanceMode" class="w-4 h-4 text-red-600 rounded"/>
            <span class="text-sm text-gray-700">Mode maintenance (matikan akses publik)</span>
          </label>
          <AppAlert v-if="saved" type="success">Pengaturan disimpan!</AppAlert>
          <AppButton type="submit" variant="primary" :loading="saving">Simpan Pengaturan</AppButton>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ref as dbRef, get, set } from 'firebase/database'
import { db } from '@/firebase'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const saving = ref(false); const saved = ref(false)
const settings = reactive({ platformName: 'QuizZy', maxParticipantsPerRoom: 100, registrationOpen: true, maintenanceMode: false })

onMounted(async () => {
  const snap = await get(dbRef(db, 'settings'))
  if (snap.exists()) Object.assign(settings, snap.val())
})

async function handleSave() {
  saving.value = true
  try { await set(dbRef(db, 'settings'), { ...settings }); saved.value = true; setTimeout(() => saved.value = false, 3000) }
  finally { saving.value = false }
}
</script>

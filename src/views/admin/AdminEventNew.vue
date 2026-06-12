<template>
  <AdminLayout page-title="Buat Event Baru">
    <div class="max-w-2xl">
      <div class="card p-8">
        <form @submit.prevent="handleCreate" class="space-y-5">
          <AppInput v-model="form.title" label="Nama Event" placeholder="Contoh: Olimpiade Ekonomi Islam 2025" :error="errors.title" required />
          <div>
            <label class="label">Deskripsi</label>
            <textarea v-model="form.description" rows="3" class="input resize-none" placeholder="Deskripsi singkat event..."></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <AppInput v-model="form.startDate" type="date" label="Tanggal Mulai" :error="errors.startDate" required />
            <AppInput v-model="form.endDate" type="date" label="Tanggal Selesai" :error="errors.endDate" required />
          </div>
          <div>
            <label class="label">Status</label>
            <select v-model="form.status" class="input">
              <option value="draft">Draft</option>
              <option value="active">Aktif</option>
            </select>
          </div>
          <AppAlert v-if="errors.general" type="error">{{ errors.general }}</AppAlert>
          <div class="flex gap-3 pt-2">
            <AppButton type="button" variant="secondary" @click="router.back()">Batal</AppButton>
            <AppButton type="submit" variant="primary" :loading="loading">Buat Event</AppButton>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ref as dbRef, push, set } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const router = useRouter(); const authStore = useAuthStore()
const loading = ref(false)
const form = reactive({ title: '', description: '', startDate: '', endDate: '', status: 'draft' })
const errors = reactive({ title: '', startDate: '', endDate: '', general: '' })

async function handleCreate() {
  Object.keys(errors).forEach(k => errors[k] = '')
  if (!form.title) { errors.title = 'Nama event wajib diisi'; return }
  if (!form.startDate) { errors.startDate = 'Tanggal mulai wajib diisi'; return }
  loading.value = true
  try {
    const newRef = push(dbRef(db, 'events'))
    await set(newRef, {
      title: form.title, description: form.description,
      startDate: form.startDate, endDate: form.endDate,
      status: form.status, createdBy: authStore.user?.uid,
      createdAt: Date.now(), roomCount: 0, totalParticipants: 0
    })
    router.push('/admin/events/' + newRef.key)
  } catch(e) { errors.general = e.message }
  finally { loading.value = false }
}
</script>

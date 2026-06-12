<template>
  <AdminLayout page-title="Manajemen Pengguna">
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-sm text-gray-500">Superadmin only</h2>
        <AppButton variant="primary" @click="showAdd = true">+ Tambah Admin</AppButton>
      </div>
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50"><tr>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Nama</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Email / NIM</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Role</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-gray-500">Bergabung</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="u in users" :key="u.uid">
                <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ u.name }}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ u.email || u.nim }}</td>
                <td class="px-4 py-3"><AppBadge :color="u.role === 'superadmin' ? 'purple' : u.role === 'admin' ? 'primary' : 'gray'">{{ u.role }}</AppBadge></td>
                <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(u.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="loading" class="py-8 text-center text-gray-400 text-sm">Memuat...</div>
        </div>
      </div>
    </div>

    <AppModal v-model="showAdd" title="Tambah Admin" size="sm">
      <form @submit.prevent="handleAddAdmin" class="space-y-4">
        <AppInput v-model="addForm.name" label="Nama" placeholder="Nama lengkap" required/>
        <AppInput v-model="addForm.email" type="email" label="Email" placeholder="admin@example.com" required/>
        <AppInput v-model="addForm.password" type="password" label="Password Sementara" placeholder="Min. 6 karakter" required/>
        <div>
          <label class="label">Role</label>
          <select v-model="addForm.role" class="input">
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
        <AppAlert v-if="addError" type="error">{{ addError }}</AppAlert>
        <AppButton type="submit" variant="primary" class="w-full" :loading="addLoading">Buat Akun Admin</AppButton>
      </form>
    </AppModal>
  </AdminLayout>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { ref as dbRef, get, query, orderByChild, set } from 'firebase/database'
import { auth, db } from '@/firebase'
import { formatDate } from '@/utils/helpers'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppAlert from '@/components/ui/AppAlert.vue'

const users = ref([]); const loading = ref(true); const showAdd = ref(false)
const addLoading = ref(false); const addError = ref('')
const addForm = reactive({ name: '', email: '', password: '', role: 'admin' })

onMounted(async () => {
  try {
    const snap = await get(dbRef(db, 'users'))
    if (snap.exists()) users.value = Object.values(snap.val()).filter(u => ['admin','superadmin','viewer'].includes(u.role))
  } finally { loading.value = false }
})

async function handleAddAdmin() {
  addError.value = ''
  addLoading.value = true
  try {
    const cred = await createUserWithEmailAndPassword(auth, addForm.email, addForm.password)
    await set(dbRef(db, 'users/' + cred.user.uid), {
      uid: cred.user.uid, name: addForm.name, email: addForm.email,
      role: addForm.role, createdAt: Date.now()
    })
    users.value.push({ uid: cred.user.uid, name: addForm.name, email: addForm.email, role: addForm.role, createdAt: Date.now() })
    showAdd.value = false
    Object.assign(addForm, { name: '', email: '', password: '', role: 'admin' })
  } catch(e) { addError.value = e.message }
  finally { addLoading.value = false }
}
</script>

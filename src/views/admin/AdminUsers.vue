<template>
  <AdminLayout page-title="Manajemen Pengguna">
    <div class="space-y-4">

      <!-- Tabs -->
      <div class="flex bg-gray-100 rounded-xl p-1">
        <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
          :class="['flex-1 py-2 text-sm font-medium rounded-lg transition-all', activeTab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500']">
          {{ t.label }}
        </button>
      </div>

      <!-- Tab: Daftar User -->
      <div v-if="activeTab === 'users'">
        <div v-if="loading" class="space-y-3"><div v-for="i in 4" :key="i" class="skeleton h-16 rounded-xl"/></div>
        <div v-else-if="users.length" class="card overflow-hidden divide-y divide-gray-50">
          <div v-for="u in users" :key="u.uid" class="px-4 py-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
              <span class="text-white text-xs font-bold">{{ (u.name || 'U')[0].toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ u.name }}</p>
              <p class="text-xs text-gray-500 truncate">{{ u.email || u.nim }} · {{ u.instansi || u.prodi || '' }}</p>
              <p v-if="u.matkul" class="text-xs text-primary-600">{{ u.matkul }}</p>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span :class="['badge text-xs', roleBadge(u.role)]">{{ u.role }}</span>
              <button v-if="u.role !== 'superadmin'" @click="changeRole(u)"
                class="text-xs text-gray-400 hover:text-primary-600 transition-colors">
                Ubah role
              </button>
            </div>
          </div>
        </div>
        <div v-else class="card p-10 text-center text-gray-400 text-sm">Belum ada pengguna admin.</div>
      </div>

      <!-- Tab: Undangan -->
      <div v-if="activeTab === 'invites'" class="space-y-4">
        <!-- Generate invite -->
        <div class="card p-4 space-y-3">
          <p class="font-semibold text-gray-900 text-sm">Buat Undangan Baru</p>
          <div>
            <label class="label text-xs">Role</label>
            <select v-model="newInvite.role" class="input text-sm">
              <option value="moderator">Moderator (Dosen/Pembuat Soal)</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer (Hanya Lihat)</option>
            </select>
          </div>
          <div>
            <label class="label text-xs">Catatan (opsional)</label>
            <input v-model="newInvite.note" placeholder="Contoh: Untuk Dosen Ekonomi Makro" class="input text-sm"/>
          </div>
          <div>
            <label class="label text-xs">Kedaluwarsa</label>
            <select v-model="newInvite.expiry" class="input text-sm">
              <option value="1">1 hari</option>
              <option value="7">7 hari</option>
              <option value="30">30 hari</option>
              <option value="0">Tidak kedaluwarsa</option>
            </select>
          </div>
          <button @click="generateInvite" :disabled="generatingInvite"
            class="w-full py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg v-if="generatingInvite" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Generate Token Undangan
          </button>
        </div>

        <!-- Generated token -->
        <div v-if="generatedToken" class="card p-4 border-2 border-primary-200">
          <p class="text-xs text-gray-500 mb-2">Token berhasil dibuat! Kirimkan ke dosen/moderator:</p>
          <div class="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <p class="font-mono text-sm text-gray-800 flex-1 break-all">{{ generatedToken }}</p>
            <button @click="copyToken" class="flex-shrink-0 px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700 transition-colors">
              {{ copied ? 'Tersalin!' : 'Copy' }}
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-2">Link daftar: <span class="text-primary-600">{{ registerUrl }}</span></p>
          <button @click="copyLink" class="mt-1 text-xs text-primary-600 hover:underline">Copy link daftar</button>
        </div>

        <!-- Active invites -->
        <div>
          <p class="text-sm font-semibold text-gray-700 mb-3">Undangan Aktif</p>
          <div v-if="invites.length" class="space-y-2">
            <div v-for="inv in invites" :key="inv.id" class="card p-3 flex items-center gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span :class="['badge text-xs', roleBadge(inv.role)]">{{ inv.role }}</span>
                  <span v-if="inv.used" class="badge text-xs bg-gray-100 text-gray-500">Sudah dipakai</span>
                </div>
                <p class="text-xs text-gray-500 mt-1 font-mono truncate">{{ inv.id }}</p>
                <p v-if="inv.note" class="text-xs text-gray-400">{{ inv.note }}</p>
                <p class="text-xs text-gray-400">{{ formatDateTime(inv.createdAt) }}</p>
              </div>
            </div>
          </div>
          <div v-else class="card p-8 text-center text-gray-400 text-sm">Belum ada undangan.</div>
        </div>
      </div>
    </div>

    <!-- Change role modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showRoleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showRoleModal = false"/>
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6">
            <h3 class="font-semibold text-gray-900 mb-1">Ubah Role</h3>
            <p class="text-sm text-gray-500 mb-4">{{ selectedUser?.name }}</p>
            <div class="space-y-2">
              <label v-for="r in availableRoles" :key="r.value"
                :class="['flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                  newRole === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300']">
                <input type="radio" v-model="newRole" :value="r.value" class="sr-only"/>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ r.label }}</p>
                  <p class="text-xs text-gray-500">{{ r.desc }}</p>
                </div>
              </label>
            </div>
            <div class="flex gap-3 mt-4">
              <button @click="showRoleModal = false" class="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">Batal</button>
              <button @click="saveRole" :disabled="savingRole"
                class="flex-1 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 disabled:opacity-60">
                {{ savingRole ? 'Menyimpan...' : 'Simpan' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ref as dbRef, get, set, update, push } from 'firebase/database'
import { db } from '@/firebase'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/helpers'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const authStore = useAuthStore()
const activeTab = ref('users')
const tabs = [{ id: 'users', label: 'Daftar Pengguna' }, { id: 'invites', label: 'Undangan' }]
const users = ref([])
const invites = ref([])
const loading = ref(true)
const generatingInvite = ref(false)
const generatedToken = ref('')
const copied = ref(false)
const showRoleModal = ref(false)
const selectedUser = ref(null)
const newRole = ref('')
const savingRole = ref(false)

const newInvite = reactive({ role: 'moderator', note: '', expiry: '7' })
const registerUrl = computed(() => window.location.origin + '/admin/register')

const availableRoles = [
  { value: 'moderator', label: 'Moderator', desc: 'Buat soal & event sendiri' },
  { value: 'admin', label: 'Admin', desc: 'Kelola semua event & user' },
  { value: 'viewer', label: 'Viewer', desc: 'Hanya lihat hasil' },
]

function roleBadge(r) {
  return {
    superadmin: 'bg-purple-100 text-purple-700',
    admin: 'bg-primary-100 text-primary-700',
    moderator: 'bg-green-100 text-green-700',
    viewer: 'bg-gray-100 text-gray-500',
    peserta: 'bg-amber-100 text-amber-700',
  }[r] || 'bg-gray-100 text-gray-500'
}

onMounted(async () => {
  try {
    const snap = await get(dbRef(db, 'users'))
    if (snap.exists()) {
      users.value = Object.values(snap.val())
        .filter(u => ['admin', 'superadmin', 'viewer', 'moderator'].includes(u.role))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    }
    const iSnap = await get(dbRef(db, 'admin_invites'))
    if (iSnap.exists()) {
      invites.value = Object.entries(iSnap.val())
        .map(([id, inv]) => ({ id, ...inv }))
        .sort((a, b) => b.createdAt - a.createdAt)
    }
  } finally { loading.value = false }
})

async function generateInvite() {
  generatingInvite.value = true
  try {
    const newRef = push(dbRef(db, 'admin_invites'))
    const expiresAt = newInvite.expiry === '0' ? null : Date.now() + (parseInt(newInvite.expiry) * 24 * 60 * 60 * 1000)
    const data = {
      role: newInvite.role, note: newInvite.note,
      createdBy: authStore.user?.uid, createdAt: Date.now(),
      expiresAt, used: false
    }
    await set(newRef, data)
    generatedToken.value = newRef.key
    invites.value.unshift({ id: newRef.key, ...data })
  } finally { generatingInvite.value = false }
}

async function copyToken() {
  await navigator.clipboard.writeText(generatedToken.value)
  copied.value = true; setTimeout(() => copied.value = false, 2000)
}

async function copyLink() {
  const link = `${window.location.origin}/admin/register?token=${generatedToken.value}`
  await navigator.clipboard.writeText(link)
}

function changeRole(u) {
  selectedUser.value = u; newRole.value = u.role; showRoleModal.value = true
}

async function saveRole() {
  savingRole.value = true
  try {
    await update(dbRef(db, 'users/' + selectedUser.value.uid), { role: newRole.value })
    const idx = users.value.findIndex(u => u.uid === selectedUser.value.uid)
    if (idx >= 0) users.value[idx].role = newRole.value
    showRoleModal.value = false
  } finally { savingRole.value = false }
}
</script>

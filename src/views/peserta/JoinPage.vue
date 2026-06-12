<template>
  <PesertaLayout>
    <div class="max-w-md mx-auto">
      <div class="card p-8">
        <h1 class="text-xl font-bold text-gray-900 mb-2">Join Quiz</h1>
        <p class="text-gray-500 text-sm mb-6">Masukkan kode room dari panitia</p>
        <div class="space-y-4">
          <AppInput v-model="code" label="Kode Room" placeholder="Contoh: AB3C9D" class="uppercase tracking-widest text-lg text-center font-bold" :error="error" />
          <AppButton variant="primary" size="lg" class="w-full" :loading="loading" @click="handleJoin">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            Masuk ke Room
          </AppButton>
          <AppButton variant="secondary" size="md" class="w-full" @click="router.push('/dashboard')">Kembali</AppButton>
        </div>
      </div>
    </div>
  </PesertaLayout>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ref as dbRef, get, query, orderByChild, equalTo } from 'firebase/database'
import { db } from '@/firebase'
import PesertaLayout from '@/components/layout/PesertaLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
const route = useRoute(); const router = useRouter()
const code = ref(''); const error = ref(''); const loading = ref(false)
onMounted(() => { if (route.params.code) code.value = String(route.params.code).toUpperCase() })
async function handleJoin() {
  error.value = ''
  const c = code.value.trim().toUpperCase()
  if (c.length !== 6) { error.value = 'Kode harus 6 karakter'; return }
  loading.value = true
  try {
    const snap = await get(query(dbRef(db, 'room_codes'), orderByChild('code'), equalTo(c)))
    if (!snap.exists()) { error.value = 'Kode tidak ditemukan atau sudah kedaluwarsa'; return }
    const roomId = Object.keys(snap.val())[0]
    router.push('/waiting/' + roomId)
  } catch(e) { error.value = e.message }
  finally { loading.value = false }
}
</script>

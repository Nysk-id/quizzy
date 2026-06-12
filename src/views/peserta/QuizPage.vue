<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col no-select" :class="{ 'cursor-not-allowed': isLocked }">
    <!-- Anti-cheat warning -->
    <Transition name="slide-down">
      <div v-if="isWarning" class="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 text-center text-sm font-medium">
        ⚠️ {{ warningMessage }} (Pelanggaran: {{ violationCount }}/5)
      </div>
    </Transition>

    <!-- Locked overlay -->
    <div v-if="isLocked" class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div class="text-center p-8">
        <div class="text-6xl mb-4">🔒</div>
        <h2 class="text-2xl font-bold mb-2">Sesi Dikunci</h2>
        <p class="text-gray-400">Terlalu banyak pelanggaran terdeteksi. Hubungi panitia.</p>
      </div>
    </div>

    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-4 sticky top-0 z-40">
      <div class="flex-1">
        <p class="text-sm font-medium truncate">{{ quizStore.currentRoom?.title }}</p>
        <p class="text-xs text-gray-400">{{ quizStore.answeredCount }}/{{ quizStore.totalQuestions }} dijawab</p>
      </div>
      <!-- Timer -->
      <div :class="['flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg transition-colors',
        timer.isDanger.value ? 'bg-red-600 animate-pulse-soft' : timer.isWarning.value ? 'bg-amber-600' : 'bg-gray-700']">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ timer.formatted.value }}
      </div>
      <!-- Progress -->
      <div class="text-sm text-gray-400">{{ Math.round(quizStore.progress) }}%</div>
    </header>

    <!-- Progress bar -->
    <div class="h-1 bg-gray-700">
      <div class="h-full bg-primary-500 transition-all duration-300" :style="{ width: quizStore.progress + '%' }"></div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Question nav sidebar (desktop) -->
      <aside class="hidden lg:flex flex-col w-56 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
        <p class="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Navigasi Soal</p>
        <div class="grid grid-cols-5 gap-1.5">
          <button v-for="(q, i) in quizStore.questions" :key="q.id"
            @click="quizStore.goToQuestion(i)"
            :class="['w-8 h-8 rounded-lg text-xs font-medium transition-all',
              i === quizStore.currentQuestionIndex ? 'bg-primary-600 text-white' :
              quizStore.myAnswers[q.id] ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600']">
            {{ i + 1 }}
          </button>
        </div>
        <div class="mt-4 space-y-2 text-xs text-gray-400">
          <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-green-700"></div> Sudah dijawab</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-primary-600"></div> Soal aktif</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-gray-700"></div> Belum dijawab</div>
        </div>
      </aside>

      <!-- Main quiz area -->
      <main class="flex-1 overflow-y-auto p-4 lg:p-8">
        <div class="max-w-2xl mx-auto">
          <Transition name="fade" mode="out-in">
            <div v-if="currentQ" :key="currentQ.id" class="animate-fade-in">
              <!-- Question number & type -->
              <div class="flex items-center gap-3 mb-4">
                <span class="badge-primary badge px-3 py-1">Soal {{ quizStore.currentQuestionIndex + 1 }} dari {{ quizStore.totalQuestions }}</span>
                <span class="badge bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full capitalize">{{ currentQ.type === 'single' ? 'Pilihan Ganda' : currentQ.type === 'multiple' ? 'Multiple Answer' : 'Essay' }}</span>
                <span class="ml-auto text-sm text-gray-400 font-medium">{{ currentQ.points || 10 }} poin</span>
              </div>

              <!-- Question text -->
              <div class="bg-gray-800 rounded-2xl p-6 mb-6">
                <p class="text-lg leading-relaxed">{{ currentQ.text }}</p>
                <img v-if="currentQ.imageUrl" :src="currentQ.imageUrl" class="mt-4 rounded-xl max-h-64 object-contain" alt="Gambar soal" />
              </div>

              <!-- Options: Single/Multiple -->
              <div v-if="currentQ.type !== 'essay'" class="space-y-3">
                <p v-if="currentQ.type === 'multiple'" class="text-xs text-amber-400 mb-2">⚠️ Boleh pilih lebih dari satu jawaban</p>
                <button v-for="opt in currentQ.options" :key="opt.id"
                  @click="selectAnswer(opt.id)"
                  :class="['w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-3',
                    isSelected(opt.id) ? 'border-primary-500 bg-primary-500/20 text-white' : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500 hover:bg-gray-750']">
                  <div :class="['w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    isSelected(opt.id) ? 'border-primary-400 bg-primary-500' : 'border-gray-500']">
                    <div v-if="isSelected(opt.id)" class="w-2.5 h-2.5 rounded-full bg-white"></div>
                  </div>
                  <span class="font-medium mr-2 text-gray-400">{{ opt.id }}.</span>
                  <span>{{ opt.text }}</span>
                </button>
              </div>

              <!-- Essay -->
              <div v-else>
                <textarea v-model="essayAnswer"
                  @input="quizStore.saveAnswer(currentQ.id, essayAnswer)"
                  class="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                  rows="6" placeholder="Tulis jawaban kamu di sini..."></textarea>
                <p class="text-xs text-gray-500 mt-2 text-right">{{ (essayAnswer || '').length }} karakter</p>
              </div>

              <!-- Navigation -->
              <div class="flex items-center gap-3 mt-8">
                <AppButton variant="ghost" size="lg" class="text-gray-300" @click="quizStore.prevQuestion" :disabled="quizStore.currentQuestionIndex === 0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                  Sebelumnya
                </AppButton>
                <div class="flex-1"></div>
                <AppButton v-if="quizStore.currentQuestionIndex < quizStore.totalQuestions - 1" variant="primary" size="lg" @click="quizStore.nextQuestion">
                  Berikutnya
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </AppButton>
                <AppButton v-else variant="success" size="lg" @click="showConfirmSubmit = true" :loading="submitting">
                  Kumpulkan Jawaban
                </AppButton>
              </div>
            </div>
          </Transition>
        </div>
      </main>

      <!-- Leaderboard sidebar -->
      <aside v-if="quizStore.currentRoom?.showLeaderboard" class="hidden xl:flex flex-col w-56 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
        <p class="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Leaderboard</p>
        <div class="space-y-2">
          <div v-for="(p, i) in quizStore.leaderboard.slice(0, 10)" :key="p.uid"
            :class="['flex items-center gap-2 px-3 py-2 rounded-lg', p.uid === authStore.user?.uid ? 'bg-primary-900/50' : '']">
            <span class="text-xs font-bold w-5 text-center" :class="i < 3 ? 'text-amber-400' : 'text-gray-500'">#{{ i+1 }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium truncate">{{ p.name || 'Peserta' }}</p>
            </div>
            <span class="text-xs font-bold text-primary-400">{{ p.score }}</span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Confirm submit modal -->
    <AppModal v-model="showConfirmSubmit" title="Kumpulkan Jawaban?" size="sm">
      <div class="space-y-3">
        <p class="text-sm text-gray-600">{{ unansweredCount > 0 ? `Masih ada ${unansweredCount} soal yang belum dijawab.` : 'Semua soal sudah dijawab.' }} Yakin ingin mengumpulkan?</p>
        <div class="flex gap-3">
          <AppButton variant="secondary" class="flex-1" @click="showConfirmSubmit = false">Batal</AppButton>
          <AppButton variant="success" class="flex-1" :loading="submitting" @click="handleSubmit">Ya, Kumpulkan</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>
<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import { useAuthStore } from '@/stores/auth'
import { useAntiCheat } from '@/composables/useAntiCheat'
import { useTimer } from '@/composables/useTimer'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'

const route = useRoute(); const router = useRouter()
const quizStore = useQuizStore(); const authStore = useAuthStore()
const { isWarning, warningMessage, violationCount, isLocked } = useAntiCheat(true)
const timer = useTimer()
const showConfirmSubmit = ref(false)
const submitting = ref(false)
const essayAnswer = ref('')

const currentQ = computed(() => quizStore.currentQuestion)
const unansweredCount = computed(() => quizStore.totalQuestions - quizStore.answeredCount)

function isSelected(optId) {
  const ans = quizStore.myAnswers[currentQ.value?.id]
  if (!ans) return false
  if (Array.isArray(ans)) return ans.includes(optId)
  return ans === optId
}

function selectAnswer(optId) {
  if (!currentQ.value) return
  if (currentQ.value.type === 'single') {
    quizStore.saveAnswer(currentQ.value.id, optId)
  } else {
    const current = quizStore.myAnswers[currentQ.value.id] || []
    const arr = Array.isArray(current) ? [...current] : [current]
    const idx = arr.indexOf(optId)
    if (idx >= 0) arr.splice(idx, 1); else arr.push(optId)
    quizStore.saveAnswer(currentQ.value.id, arr)
  }
}

// Sync essay answer when question changes
watch(currentQ, (q) => {
  if (q?.type === 'essay') essayAnswer.value = quizStore.myAnswers[q.id] || ''
})

async function handleSubmit() {
  submitting.value = true
  try {
    await quizStore.submitAll()
    router.push('/result/' + route.params.roomId)
  } finally { submitting.value = false }
}

onMounted(() => {
  if (!quizStore.currentRoom) { router.push('/dashboard'); return }
  const config = quizStore.currentRoom.timerConfig
  if (config?.type === 'total' || config?.type === 'both') {
    timer.start(config.totalSeconds, () => handleSubmit())
  }
})
</script>

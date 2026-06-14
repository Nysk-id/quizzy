<template>
  <div class="min-h-screen bg-gray-900 text-white flex flex-col select-none" style="-webkit-user-select:none">

    <!-- Anti-cheat warning banner -->
    <Transition name="slide-down">
      <div v-if="isWarning"
        class="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-3 text-center text-sm font-medium shadow-lg">
        ⚠️ {{ warningMessage }}
        <span class="ml-2 opacity-75">(Pelanggaran {{ violationCount }}/{{ maxViolations }})</span>
      </div>
    </Transition>

    <!-- Locked overlay -->
    <Transition name="fade">
      <div v-if="isLocked" class="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6">
        <div class="text-center max-w-sm">
          <div class="text-6xl mb-4">🔒</div>
          <h2 class="text-2xl font-bold mb-2">Sesi Dikunci</h2>
          <p class="text-gray-400 text-sm mb-6">Terlalu banyak pelanggaran terdeteksi. Hubungi panitia untuk membuka kunci.</p>
          <button @click="router.push('/dashboard')" class="px-6 py-2.5 border border-gray-600 text-gray-300 rounded-xl text-sm hover:bg-gray-800 transition-colors">
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </Transition>

    <!-- Submitted overlay -->
    <Transition name="fade">
      <div v-if="quizStore.submitted && !navigating" class="fixed inset-0 z-[200] bg-gray-900 flex items-center justify-center p-6">
        <div class="text-center max-w-sm">
          <div class="w-20 h-20 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-5">
            <svg class="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-2xl font-bold mb-2">Quiz Dikumpulkan!</h2>
          <p class="text-gray-400 text-sm mb-2">{{ quizStore.answeredCount }} dari {{ quizStore.totalQuestions }} soal dijawab</p>
          <p class="text-gray-500 text-xs mb-6">Mengalihkan ke halaman hasil...</p>
          <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </Transition>

    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 px-3 py-2.5 flex items-center gap-3 sticky top-0 z-40"
      :class="isWarning ? 'mt-12' : ''">
      <!-- Room name -->
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-gray-300 truncate">{{ quizStore.room?.title }}</p>
        <p class="text-xs text-gray-500">{{ quizStore.answeredCount }}/{{ quizStore.totalQuestions }} dijawab</p>
      </div>

      <!-- Total timer -->
      <div v-if="quizStore.hasTotalTimer"
        :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm transition-all',
          quizStore.totalTimeLeft <= 30 ? 'bg-red-600 animate-pulse-soft' :
          quizStore.totalTimeLeft <= 60 ? 'bg-amber-600' : 'bg-gray-700']">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ formatTime(quizStore.totalTimeLeft) }}
      </div>

      <!-- Question timer -->
      <div v-if="quizStore.hasQuestionTimer && !quizStore.hasTotalTimer"
        :class="['flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm transition-all',
          quizStore.questionTimeLeft <= 10 ? 'bg-red-600 animate-pulse-soft' :
          quizStore.questionTimeLeft <= 20 ? 'bg-amber-600' : 'bg-gray-700']">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ formatTime(quizStore.questionTimeLeft) }}
      </div>

      <!-- Submit button -->
      <button @click="showConfirm = true"
        :disabled="submitting"
        class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-xl transition-colors disabled:opacity-60">
        Kumpulkan
      </button>
    </header>

    <!-- Progress bar -->
    <div class="h-1 bg-gray-700 flex-shrink-0">
      <div class="h-full bg-primary-500 transition-all duration-500"
        :style="{ width: quizStore.progress + '%' }"></div>
    </div>

    <!-- Body: sidebar + main -->
    <div class="flex flex-1 overflow-hidden">

      <!-- Nav sidebar (desktop only) -->
      <aside class="hidden lg:flex flex-col w-52 bg-gray-800 border-r border-gray-700 p-3 overflow-y-auto flex-shrink-0">
        <p class="text-xs text-gray-400 font-medium mb-2 px-1">Navigasi Soal</p>
        <div class="grid grid-cols-5 gap-1.5 mb-4">
          <button v-for="(q, i) in quizStore.questions" :key="q.id"
            @click="quizStore.goTo(i)"
            :class="['w-8 h-8 rounded-lg text-xs font-medium transition-all focus:outline-none',
              i === quizStore.currentIndex ? 'bg-primary-600 text-white ring-2 ring-primary-400' :
              hasAnswer(q.id) ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600']">
            {{ i + 1 }}
          </button>
        </div>
        <div class="space-y-1.5 text-xs text-gray-400 mt-2">
          <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-green-700"></div> Sudah dijawab</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-primary-600"></div> Soal aktif</div>
          <div class="flex items-center gap-2"><div class="w-3 h-3 rounded bg-gray-700"></div> Belum dijawab</div>
        </div>

        <!-- Question timer (desktop sidebar) -->
        <div v-if="quizStore.hasQuestionTimer" class="mt-4 bg-gray-700 rounded-xl p-3 text-center">
          <p class="text-xs text-gray-400 mb-1">Timer Soal</p>
          <p :class="['text-2xl font-bold transition-colors',
            quizStore.questionTimeLeft <= 10 ? 'text-red-400 animate-pulse-soft' :
            quizStore.questionTimeLeft <= 20 ? 'text-amber-400' : 'text-white']">
            {{ formatTime(quizStore.questionTimeLeft) }}
          </p>
        </div>
      </aside>

      <!-- Question area -->
      <main class="flex-1 overflow-y-auto">
        <div class="max-w-2xl mx-auto p-4 lg:p-6 pb-24 lg:pb-8">

          <!-- Question timer mobile -->
          <div v-if="quizStore.hasQuestionTimer && !quizStore.hasTotalTimer"
            class="lg:hidden mb-4 flex items-center justify-center gap-2 bg-gray-800 rounded-xl px-4 py-2">
            <span class="text-xs text-gray-400">Timer soal:</span>
            <span :class="['font-bold', quizStore.questionTimeLeft <= 10 ? 'text-red-400 animate-pulse-soft' : 'text-white']">
              {{ formatTime(quizStore.questionTimeLeft) }}
            </span>
          </div>

          <Transition name="fade" mode="out-in">
            <div v-if="currentQ" :key="currentQ.id">

              <!-- Question header -->
              <div class="flex items-center gap-2 mb-4 flex-wrap">
                <span class="px-3 py-1 bg-primary-900/60 text-primary-300 text-xs font-medium rounded-full">
                  Soal {{ quizStore.currentIndex + 1 }} / {{ quizStore.totalQuestions }}
                </span>
                <span class="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-full capitalize">
                  {{ currentQ.type === 'single' ? 'Pilihan Ganda' : currentQ.type === 'multiple' ? 'Multiple Answer' : 'Essay' }}
                </span>
                <span class="ml-auto text-xs text-gray-400 font-medium">{{ currentQ.points || 10 }} poin</span>
              </div>

              <!-- Multiple answer hint -->
              <div v-if="currentQ.type === 'multiple'" class="mb-3 flex items-center gap-2 text-amber-400 text-xs bg-amber-900/20 px-3 py-2 rounded-lg">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Bisa pilih lebih dari satu jawaban
              </div>

              <!-- Question text -->
              <div class="bg-gray-800 rounded-2xl p-5 mb-5">
                <p class="text-base leading-relaxed">{{ currentQ.text }}</p>
                <img v-if="currentQ.imageUrl" :src="currentQ.imageUrl"
                  class="mt-4 rounded-xl max-h-60 object-contain w-full" alt="Gambar soal"/>
              </div>

              <!-- Options: PG -->
              <div v-if="currentQ.type !== 'essay'" class="space-y-2.5">
                <button v-for="opt in currentQ.options" :key="opt.id"
                  @click="quizStore.selectAnswer(currentQ.id, opt.id, currentQ.type)"
                  :class="['w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all duration-150 flex items-start gap-3 focus:outline-none',
                    quizStore.isOptionSelected(currentQ.id, opt.id)
                      ? 'border-primary-500 bg-primary-500/20'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-500']">
                  <!-- Checkbox/radio indicator -->
                  <div :class="['w-5 h-5 flex-shrink-0 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all',
                    quizStore.isOptionSelected(currentQ.id, opt.id)
                      ? 'border-primary-400 bg-primary-500'
                      : 'border-gray-500']">
                    <div v-if="quizStore.isOptionSelected(currentQ.id, opt.id)"
                      class="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div class="flex-1">
                    <span class="font-semibold text-gray-400 mr-2 text-sm">{{ opt.id }}.</span>
                    <span class="text-sm">{{ opt.text }}</span>
                  </div>
                </button>
              </div>

              <!-- Essay -->
              <div v-else>
                <textarea
                  :value="quizStore.getAnswer(currentQ.id) || ''"
                  @input="quizStore.setEssayAnswer(currentQ.id, $event.target.value)"
                  class="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none text-sm"
                  rows="6" placeholder="Tulis jawaban kamu di sini...">
                </textarea>
                <p class="text-xs text-gray-500 mt-1 text-right">
                  {{ (quizStore.getAnswer(currentQ.id) || '').length }} karakter
                </p>
              </div>

              <!-- Navigation buttons -->
              <div class="flex gap-3 mt-6">
                <button @click="quizStore.prev()"
                  :disabled="quizStore.currentIndex === 0"
                  class="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Sebelumnya
                </button>

                <div class="flex-1"></div>

                <!-- Mobile: soal navigator dots -->
                <div class="flex items-center gap-1 lg:hidden">
                  <div v-for="(q, i) in quizStore.questions.slice(Math.max(0, quizStore.currentIndex - 2), quizStore.currentIndex + 3)"
                    :key="i"
                    :class="['w-2 h-2 rounded-full transition-all',
                      quizStore.questions.indexOf(q) === quizStore.currentIndex ? 'bg-primary-400 w-3' :
                      hasAnswer(q.id) ? 'bg-green-600' : 'bg-gray-600']">
                  </div>
                </div>

                <button v-if="quizStore.currentIndex < quizStore.totalQuestions - 1"
                  @click="quizStore.next()"
                  class="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors">
                  Berikutnya
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>

                <button v-else @click="showConfirm = true"
                  :disabled="submitting"
                  class="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  Kumpulkan
                </button>
              </div>

            </div>
          </Transition>

          <!-- Loading soal -->
          <div v-if="!currentQ && !quizStore.submitted" class="text-center py-16 text-gray-400">
            <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Memuat soal...
          </div>
        </div>
      </main>

      <!-- Leaderboard sidebar (desktop, kalau diizinkan) -->
      <aside v-if="quizStore.room?.showLeaderboard && quizStore.leaderboard.length"
        class="hidden xl:flex flex-col w-48 bg-gray-800 border-l border-gray-700 p-3 overflow-y-auto flex-shrink-0">
        <p class="text-xs text-gray-400 font-medium mb-2 px-1">Leaderboard</p>
        <div class="space-y-1.5">
          <div v-for="(entry, i) in quizStore.leaderboard.slice(0, 10)" :key="entry.uid"
            :class="['flex items-center gap-2 px-2 py-2 rounded-lg text-xs',
              entry.uid === authStore.user?.uid ? 'bg-primary-900/40' : '']">
            <span :class="['font-bold w-4 text-center flex-shrink-0',
              i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500']">
              {{ i + 1 }}
            </span>
            <span class="flex-1 truncate text-gray-300">{{ entry.name || 'Peserta' }}</span>
            <span class="font-bold text-primary-400 flex-shrink-0">{{ entry.score }}</span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Confirm submit modal (bottom sheet di mobile) -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConfirm" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div class="absolute inset-0 bg-black/60" @click="showConfirm = false"/>
          <div class="relative bg-gray-800 border border-gray-700 w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6">
            <h3 class="text-lg font-bold text-white mb-1">Kumpulkan Jawaban?</h3>
            <p v-if="quizStore.unansweredCount > 0" class="text-amber-400 text-sm mb-1">
              ⚠️ Masih {{ quizStore.unansweredCount }} soal belum dijawab.
            </p>
            <p v-else class="text-green-400 text-sm mb-1">✓ Semua soal sudah dijawab!</p>
            <p class="text-gray-400 text-sm mb-5">Jawaban tidak bisa diubah setelah dikumpulkan.</p>
            <div class="flex gap-3">
              <button @click="showConfirm = false"
                class="flex-1 py-2.5 border border-gray-600 text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-700 transition-colors">
                Batal
              </button>
              <button @click="handleSubmit" :disabled="submitting"
                class="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                <svg v-if="submitting" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ submitting ? 'Mengumpulkan...' : 'Ya, Kumpulkan' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quiz'
import { useAuthStore } from '@/stores/auth'
import { useAntiCheat } from '@/composables/useAntiCheat'

const route = useRoute()
const router = useRouter()
const quizStore = useQuizStore()
const authStore = useAuthStore()
const roomId = route.params.roomId

const showConfirm = ref(false)
const submitting = ref(false)
const navigating = ref(false)
const maxViolations = 5

const currentQ = computed(() => quizStore.currentQuestion)

function hasAnswer(questionId) {
  const ans = quizStore.answers[questionId]
  if (ans === null || ans === undefined) return false
  if (Array.isArray(ans)) return ans.length > 0
  if (typeof ans === 'string') return ans.trim().length > 0
  return !!ans
}

function formatTime(seconds) {
  if (!seconds || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Anti-cheat
const { violationCount, isWarning, warningMessage, isLocked } = useAntiCheat(
  (type, count) => { quizStore.recordViolation(type) },
  { maxViolations, enabled: true }
)

async function handleSubmit() {
  submitting.value = true
  showConfirm.value = false
  try {
    await quizStore.submitQuiz()
    navigating.value = true
    setTimeout(() => router.push('/result/' + roomId), 1800)
  } catch (e) {
    alert('Gagal mengumpulkan: ' + e.message)
    submitting.value = false
  }
}

onMounted(() => {
  // Kalau quiz store belum punya room data, coba join ulang
  if (!quizStore.room) {
    router.push('/waiting/' + roomId)
    return
  }
  // Kalau sudah submitted, langsung ke result
  if (quizStore.submitted) {
    router.push('/result/' + roomId)
    return
  }
})

onUnmounted(() => {
  // Jangan cleanup kalau submit (masih butuh data di result page)
  if (!quizStore.submitted) {
    // Boleh cleanup kalau navigasi keluar secara manual
  }
})
</script>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; }
.slide-down-enter-from { transform: translateY(-100%); opacity: 0; }
.slide-down-leave-to { transform: translateY(-100%); opacity: 0; }
</style>

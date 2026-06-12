import { ref, onMounted, onUnmounted } from 'vue'
import { useQuizStore } from '@/stores/quiz'

export function useAntiCheat(enabled = true) {
  const quizStore = useQuizStore()
  const violationCount = ref(0)
  const isWarning = ref(false)
  const warningMessage = ref('')
  const isLocked = ref(false)
  const MAX_VIOLATIONS = 5

  function warn(message, type) {
    violationCount.value++
    isWarning.value = true
    warningMessage.value = message
    quizStore.recordViolation(type)
    if (violationCount.value >= MAX_VIOLATIONS) isLocked.value = true
    setTimeout(() => { isWarning.value = false }, 3000)
  }

  // Tab/visibility detection
  function handleVisibilityChange() {
    if (!enabled) return
    if (document.hidden) warn('Berpindah tab/window terdeteksi!', 'tab_switch')
  }

  // Fullscreen detection
  function handleFullscreenChange() {
    if (!enabled) return
    if (!document.fullscreenElement) warn('Keluar dari fullscreen terdeteksi!', 'exit_fullscreen')
  }

  // Disable right click
  function handleContextMenu(e) {
    if (!enabled) return
    e.preventDefault()
  }

  // Disable copy/paste shortcuts
  function handleKeydown(e) {
    if (!enabled) return
    const blocked = ['F12', 'F11']
    const ctrlBlocked = ['c', 'v', 'u', 's', 'a']
    if (blocked.includes(e.key)) { e.preventDefault(); return }
    if ((e.ctrlKey || e.metaKey) && ctrlBlocked.includes(e.key.toLowerCase())) {
      e.preventDefault()
    }
    // Detect devtools shortcut
    if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
      e.preventDefault()
      warn('Akses developer tools diblokir!', 'devtools')
    }
  }

  async function requestFullscreen() {
    try {
      await document.documentElement.requestFullscreen()
    } catch (e) {
      console.warn('Fullscreen tidak tersedia:', e)
    }
  }

  onMounted(() => {
    if (!enabled) return
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeydown)
    requestFullscreen()
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('contextmenu', handleContextMenu)
    document.removeEventListener('keydown', handleKeydown)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  })

  return { violationCount, isWarning, warningMessage, isLocked, requestFullscreen }
}

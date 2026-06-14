import { ref, onMounted, onUnmounted } from 'vue'

export function useAntiCheat(onViolation, options = {}) {
  const { maxViolations = 5, enabled = true } = options

  const violationCount = ref(0)
  const isWarning = ref(false)
  const warningMessage = ref('')
  const isLocked = ref(false)
  const isFullscreen = ref(false)

  function triggerWarning(message, type) {
    if (!enabled) return
    violationCount.value++
    warningMessage.value = message
    isWarning.value = true
    onViolation?.(type, violationCount.value)
    if (violationCount.value >= maxViolations) isLocked.value = true
    setTimeout(() => { isWarning.value = false }, 4000)
  }

  // Visibility (tab switch)
  function handleVisibility() {
    if (document.hidden) triggerWarning('Berpindah tab/window terdeteksi!', 'tab_switch')
  }

  // Fullscreen change
  function handleFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement
    if (!document.fullscreenElement && enabled) {
      triggerWarning('Keluar dari fullscreen terdeteksi!', 'exit_fullscreen')
    }
  }

  // Block right click
  function handleContextMenu(e) {
    if (enabled) e.preventDefault()
  }

  // Block keyboard shortcuts
  function handleKeydown(e) {
    if (!enabled) return
    // Block F12
    if (e.key === 'F12') { e.preventDefault(); return }
    // Block Ctrl+Shift+I/J/C (devtools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i','j','c','k'].includes(e.key.toLowerCase())) {
      e.preventDefault()
      triggerWarning('Akses developer tools diblokir!', 'devtools')
      return
    }
    // Block Ctrl+U (view source)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
      e.preventDefault()
      return
    }
  }

  async function requestFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch (e) {
      // Fullscreen tidak didukung di beberapa browser mobile — tidak apa-apa
      console.warn('Fullscreen request failed:', e.message)
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
  }

  onMounted(() => {
    if (!enabled) return
    document.addEventListener('visibilitychange', handleVisibility)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeydown)
    // Request fullscreen dengan delay biar browser tidak block
    setTimeout(() => requestFullscreen(), 500)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibility)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('contextmenu', handleContextMenu)
    document.removeEventListener('keydown', handleKeydown)
    exitFullscreen()
  })

  return {
    violationCount, isWarning, warningMessage, isLocked, isFullscreen,
    requestFullscreen, triggerWarning
  }
}

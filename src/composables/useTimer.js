import { ref, computed, onUnmounted } from 'vue'

export function useTimer() {
  const seconds = ref(0)
  const isRunning = ref(false)
  let interval = null

  const formatted = computed(() => {
    const s = seconds.value
    if (s < 0) return '0:00'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m + ':' + String(sec).padStart(2, '0')
  })

  const isWarning = computed(() => seconds.value <= 30 && seconds.value > 0)
  const isDanger = computed(() => seconds.value <= 10 && seconds.value > 0)
  const percentage = computed(() => {
    // needs total to calc, exposed separately
    return 100
  })

  function start(initialSeconds, onEnd) {
    clearInterval(interval)
    seconds.value = initialSeconds
    isRunning.value = true
    interval = setInterval(() => {
      seconds.value--
      if (seconds.value <= 0) {
        clearInterval(interval)
        isRunning.value = false
        if (onEnd) onEnd()
      }
    }, 1000)
  }

  function pause() {
    clearInterval(interval)
    isRunning.value = false
  }

  function resume(onEnd) {
    if (seconds.value <= 0) return
    isRunning.value = true
    interval = setInterval(() => {
      seconds.value--
      if (seconds.value <= 0) {
        clearInterval(interval)
        isRunning.value = false
        if (onEnd) onEnd()
      }
    }, 1000)
  }

  function stop() {
    clearInterval(interval)
    isRunning.value = false
    seconds.value = 0
  }

  onUnmounted(() => clearInterval(interval))

  return { seconds, formatted, isRunning, isWarning, isDanger, start, pause, resume, stop }
}

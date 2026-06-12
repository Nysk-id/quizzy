import CryptoJS from 'crypto-js'

export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function generateResultHash(uid, roomId, score, submittedAt) {
  const data = uid + '|' + roomId + '|' + score + '|' + submittedAt
  return CryptoJS.SHA256(data).toString()
}

export function formatTime(seconds) {
  if (seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m + ':' + String(s).padStart(2, '0')
}

export function formatDuration(seconds) {
  if (seconds < 60) return seconds + ' detik'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m + ' mnt' + (s ? ' ' + s + ' dtk' : '')
}

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

export function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function getRankLabel(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return '#' + rank
}

export function getScoreColor(score, max) {
  const pct = (score / max) * 100
  if (pct >= 80) return 'text-green-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function debounce(fn, ms = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

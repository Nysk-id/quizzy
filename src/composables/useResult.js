import { ref } from 'vue'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import { generateResultHash } from '@/utils/helpers'
import { formatDateTime } from '@/utils/helpers'

export function useResult() {
  const generating = ref(false)

  async function generateQRDataURL(uid, roomId, score, submittedAt) {
    const hash = generateResultHash(uid, roomId, score, submittedAt)
    const verifyUrl = window.location.origin + '/verify/' + hash
    return QRCode.toDataURL(verifyUrl, { width: 200, margin: 1 })
  }

  async function downloadResultPDF(result, profile, roomTitle, eventTitle) {
    generating.value = true
    try {
      const qrDataUrl = await generateQRDataURL(
        result.uid, result.roomId, result.score, result.submittedAt
      )
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = 210; const H = 297

      // Background gradient-ish (solid top bar)
      doc.setFillColor(79, 70, 229)
      doc.rect(0, 0, W, 50, 'F')

      // Title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text('QuizZy', W / 2, 22, { align: 'center' })
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Bukti Hasil Quiz', W / 2, 32, { align: 'center' })
      doc.text(eventTitle + ' — ' + roomTitle, W / 2, 40, { align: 'center' })

      // White card area
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(15, 60, W - 30, 180, 8, 8, 'F')

      // Profile info
      doc.setTextColor(55, 65, 81)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Nama Peserta', 25, 80)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(14)
      doc.text(profile.name, 25, 88)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('NIM', 25, 100)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(profile.nim, 25, 108)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Program Studi', 25, 120)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.text(profile.prodi, 25, 128)

      // Divider
      doc.setDrawColor(229, 231, 235)
      doc.line(25, 135, W - 25, 135)

      // Score big
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(107, 114, 128)
      doc.text('SKOR', W / 2, 148, { align: 'center' })
      doc.setFontSize(56)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(79, 70, 229)
      doc.text(String(result.score), W / 2, 175, { align: 'center' })

      // Rank & time
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text('Peringkat: #' + (result.rank || '-'), 25, 200)
      doc.text('Waktu: ' + formatDateTime(result.submittedAt), 25, 210)

      // QR
      doc.addImage(qrDataUrl, 'PNG', W - 60, 175, 45, 45)
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text('Scan untuk verifikasi', W - 37.5, 225, { align: 'center' })

      // Footer
      doc.setFillColor(249, 250, 251)
      doc.rect(0, H - 20, W, 20, 'F')
      doc.setFontSize(9)
      doc.setTextColor(156, 163, 175)
      doc.text('Dokumen ini diterbitkan oleh QuizZy. Verifikasi keaslian dengan scan QR Code.', W / 2, H - 8, { align: 'center' })

      doc.save('Hasil_Quiz_' + profile.nim + '.pdf')
    } finally {
      generating.value = false
    }
  }

  async function downloadResultImage(elementId, filename) {
    generating.value = true
    try {
      const el = document.getElementById(elementId)
      if (!el) return
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = filename || 'hasil-quiz.jpg'
      link.href = canvas.toDataURL('image/jpeg', 0.92)
      link.click()
    } finally {
      generating.value = false
    }
  }

  return { generating, downloadResultPDF, downloadResultImage, generateQRDataURL }
}

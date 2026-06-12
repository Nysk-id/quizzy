import * as XLSX from 'xlsx'
import { formatDateTime, formatDuration } from '@/utils/helpers'

export function useExport() {
  function exportResultsToExcel(results, questions, roomTitle, eventTitle) {
    const wb = XLSX.utils.book_new()

    // Sheet 1: Rekap nilai
    const rekap = [
      ['QuizZy — Rekap Hasil Quiz'],
      ['Event:', eventTitle],
      ['Sesi/Room:', roomTitle],
      ['Diekspor:', formatDateTime(Date.now())],
      [],
      ['#', 'Nama', 'NIM', 'Prodi', 'Skor', 'Peringkat', 'Waktu Pengerjaan', 'Pelanggaran', 'Waktu Submit'],
      ...results.map((r, i) => [
        i + 1, r.name, r.nim, r.prodi, r.score, r.rank,
        formatDuration(r.timeTaken), r.violations || 0, formatDateTime(r.submittedAt)
      ])
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(rekap)
    ws1['!cols'] = [{ wch: 4 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 8 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Rekap Nilai')

    // Sheet 2: Per soal
    if (questions && questions.length) {
      const perSoal = [
        ['Analisis Per Soal'],
        [],
        ['#', 'Soal', 'Tipe', 'Poin', '% Benar', 'Jumlah Benar', 'Jumlah Salah']
      ]
      questions.forEach((q, i) => {
        const total = results.length
        const benar = results.filter(r => {
          const ans = r.answers?.[q.id]
          if (!ans) return false
          if (q.type === 'single') return ans === q.correctAnswers?.[0]
          return false
        }).length
        const pct = total ? Math.round((benar / total) * 100) : 0
        perSoal.push([i + 1, q.text?.substring(0, 80), q.type, q.points || 10, pct + '%', benar, total - benar])
      })
      const ws2 = XLSX.utils.aoa_to_sheet(perSoal)
      ws2['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 14 }]
      XLSX.utils.book_append_sheet(wb, ws2, 'Analisis Soal')
    }

    const filename = 'Hasil_' + roomTitle.replace(/\s+/g, '_') + '.xlsx'
    XLSX.writeFile(wb, filename)
  }

  function generateExcelTemplate() {
    const wb = XLSX.utils.book_new()
    const data = [
      ['Template Import Soal QuizZy'],
      ['Petunjuk: Isi kolom sesuai format. Tipe: single / multiple / essay'],
      ['Opsi A/B/C/D hanya untuk tipe single dan multiple. Jawaban benar: A atau A,B untuk multiple'],
      [],
      ['No', 'Tipe', 'Pertanyaan', 'Opsi A', 'Opsi B', 'Opsi C', 'Opsi D', 'Jawaban Benar', 'Poin', 'Timer (detik)'],
      [1, 'single', 'Ibu kota Indonesia adalah?', 'Surabaya', 'Bandung', 'Jakarta', 'Medan', 'C', 10, 30],
      [2, 'multiple', 'Mana saja pulau di Indonesia?', 'Jawa', 'Sumatra', 'Madagaskar', 'Bali', 'A,B,D', 15, 45],
      [3, 'essay', 'Jelaskan pengertian demokrasi!', '', '', '', '', '', 20, ''],
    ]
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws['!cols'] = [{ wch: 4 }, { wch: 10 }, { wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 8 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Template Soal')
    XLSX.writeFile(wb, 'Template_Import_Soal_QuizZy.xlsx')
  }

  function parseExcelQuestions(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const wb = XLSX.read(data, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
          // Skip header rows (first 4 rows are header/instruction)
          const dataRows = rows.slice(5).filter(r => r[2])
          const questions = dataRows.map(r => {
            const tipe = String(r[1]).toLowerCase().trim()
            const opsi = [r[3], r[4], r[5], r[6]].filter(Boolean)
            const jawaban = String(r[7]).toUpperCase().split(',').map(s => s.trim()).filter(Boolean)
            return {
              type: tipe,
              text: String(r[2]),
              options: tipe !== 'essay' ? opsi.map((o, i) => ({
                id: String.fromCharCode(65 + i),
                text: String(o)
              })) : [],
              correctAnswers: jawaban,
              points: Number(r[8]) || 10,
              timerSeconds: Number(r[9]) || 0
            }
          })
          resolve(questions)
        } catch (err) { reject(err) }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  return { exportResultsToExcel, generateExcelTemplate, parseExcelQuestions }
}

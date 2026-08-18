// server/utils/pdfExport.ts
// Generates professional PDF financial reports using PDFKit

import PDFDocument from 'pdfkit'

interface ExportPDFOptions {
  user: { name: string; email: string; currency?: string }
  periodLabel: string
  transactions: any[]
  categories: any[]
  wallets: any[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function generateFinancialPDFReport(options: ExportPDFOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { user, periodLabel, transactions } = options

    const doc = new PDFDocument({
      size: 'A4',
      margin: 36,
      bufferPages: true,
      info: {
        Title: `Laporan Keuangan CashPlow - ${periodLabel}`,
        Author: 'CashPlow Budget Tracker',
        Creator: 'CashPlow',
      }
    })

    const buffers: Buffer[] = []
    doc.on('data', (chunk: Buffer) => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', (err: any) => reject(err))

    const primaryColor = '#059669' // Emerald
    const textDark = '#1e293b'
    const textMuted = '#64748b'

    // ── 1. HEADER ──────────────────────────────────────────────
    doc
      .rect(36, 36, 523, 70)
      .fillAndStroke('#f0fdf4', primaryColor)

    doc
      .fillColor(primaryColor)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('🌱 CashPlow — Laporan Keuangan', 52, 48)

    doc
      .fillColor(textMuted)
      .fontSize(9)
      .font('Helvetica')
      .text(`Periode: ${periodLabel.replace(/_/g, ' ')}   |   Pengguna: ${user.name} (${user.email})   |   Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 52, 74)

    doc.moveDown(4)

    // ── 2. SUMMARY METRICS ─────────────────────────────────────
    let totalIncome = 0
    let totalExpense = 0
    let totalTransfer = 0

    const catExpenseMap: Record<string, number> = {}

    for (const tx of transactions) {
      const amt = Number(tx.amount) || 0
      if (tx.type === 'INCOME') {
        totalIncome += amt
      } else if (tx.type === 'EXPENSE') {
        totalExpense += amt
        const catName = tx.category?.name || 'Lainnya'
        catExpenseMap[catName] = (catExpenseMap[catName] || 0) + amt
      } else if (tx.type === 'TRANSFER') {
        totalTransfer += amt
      }
    }

    const netCashFlow = totalIncome - totalExpense
    const startY = 120
    const cardWidth = 124
    const cardGap = 9

    // Card 1: Pemasukan
    drawSummaryCard(doc, 36, startY, cardWidth, 54, 'Pemasukan', formatCurrency(totalIncome), '#10b981', '#ecfdf5')
    // Card 2: Pengeluaran
    drawSummaryCard(doc, 36 + (cardWidth + cardGap), startY, cardWidth, 54, 'Pengeluaran', formatCurrency(totalExpense), '#ef4444', '#fef2f2')
    // Card 3: Arus Kas Bersih
    drawSummaryCard(doc, 36 + (cardWidth + cardGap) * 2, startY, cardWidth, 54, 'Arus Kas Bersih', formatCurrency(netCashFlow), netCashFlow >= 0 ? '#10b981' : '#ef4444', '#f8fafc')
    // Card 4: Total Transfer
    drawSummaryCard(doc, 36 + (cardWidth + cardGap) * 3, startY, cardWidth, 54, 'Total Transfer', formatCurrency(totalTransfer), '#3b82f6', '#eff6ff')

    // ── 3. TOP EXPENSE CATEGORIES ─────────────────────────────
    let currentY = startY + 68
    doc
      .fillColor(textDark)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('📊 Ringkasan Pengeluaran per Kategori', 36, currentY)

    currentY += 18

    const sortedCats = Object.entries(catExpenseMap).sort((a, b) => b[1] - a[1])
    if (sortedCats.length === 0) {
      doc
        .fillColor(textMuted)
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('Tidak ada pengeluaran tercatat pada periode ini.', 36, currentY)
      currentY += 20
    } else {
      sortedCats.slice(0, 6).forEach(([catName, spent], i) => {
        const pct = totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0
        const xPos = i % 2 === 0 ? 36 : 300
        const yPos = currentY + Math.floor(i / 2) * 16

        doc
          .fillColor(textDark)
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text(`• ${catName}: `, xPos, yPos, { continued: true })
          .font('Helvetica')
          .text(`${formatCurrency(spent)} (${pct}%)`)
      })
      currentY += Math.ceil(Math.min(sortedCats.length, 6) / 2) * 16 + 10
    }

    // ── 4. TRANSACTION TABLE ──────────────────────────────────
    currentY += 8
    doc
      .fillColor(textDark)
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`📋 Daftar Transaksi (${transactions.length} Data)`, 36, currentY)

    currentY += 18

    // Table Columns definitions
    const col0 = { label: 'No', x: 36, w: 24, align: 'center' as const }
    const col1 = { label: 'Tanggal', x: 60, w: 56, align: 'left' as const }
    const col2 = { label: 'Keterangan', x: 116, w: 140, align: 'left' as const }
    const col3 = { label: 'Kategori', x: 256, w: 86, align: 'left' as const }
    const col4 = { label: 'Tipe', x: 342, w: 50, align: 'center' as const }
    const col5 = { label: 'Dompet', x: 392, w: 75, align: 'left' as const }
    const col6 = { label: 'Nominal', x: 467, w: 92, align: 'right' as const }

    const allCols = [col0, col1, col2, col3, col4, col5, col6]

    // Table Header Background
    doc
      .rect(36, currentY, 523, 18)
      .fill('#f1f5f9')

    allCols.forEach((h) => {
      doc
        .fillColor('#475569')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text(h.label, h.x, currentY + 5, { width: h.w, align: h.align })
    })

    currentY += 20

    // Rows
    transactions.forEach((tx, idx) => {
      // Check page break
      if (currentY > 750) {
        doc.addPage()
        currentY = 36

        // Re-draw table header on new page
        doc
          .rect(36, currentY, 523, 18)
          .fill('#f1f5f9')

        allCols.forEach((h) => {
          doc
            .fillColor('#475569')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text(h.label, h.x, currentY + 5, { width: h.w, align: h.align })
        })
        currentY += 20
      }

      const isEven = idx % 2 === 0
      if (isEven) {
        doc.rect(36, currentY - 2, 523, 16).fill('#f8fafc')
      }

      const txDate = tx.date ? new Date(tx.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
      const desc = tx.description || tx.notes || '-'
      const cat = tx.category?.name || '-'
      const typeLabel = tx.type === 'INCOME' ? 'Masuk' : tx.type === 'EXPENSE' ? 'Keluar' : 'Transfer'
      const walletName = tx.type === 'TRANSFER'
        ? `${tx.walletFrom?.name || ''} ➔ ${tx.walletTo?.name || ''}`
        : (tx.walletFrom?.name || tx.walletTo?.name || '-')

      const amountColor = tx.type === 'INCOME' ? '#059669' : tx.type === 'EXPENSE' ? '#dc2626' : '#2563eb'
      const sign = tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''

      doc.fillColor(textDark).fontSize(7.5).font('Helvetica')
      doc.text(String(idx + 1), col0.x, currentY + 2, { width: col0.w, align: 'center' })
      doc.text(txDate, col1.x, currentY + 2, { width: col1.w, align: 'left' })
      doc.text(desc.slice(0, 30), col2.x, currentY + 2, { width: col2.w, align: 'left', ellipsis: true })
      doc.text(cat.slice(0, 18), col3.x, currentY + 2, { width: col3.w, align: 'left', ellipsis: true })
      doc.text(typeLabel, col4.x, currentY + 2, { width: col4.w, align: 'center' })
      doc.text(walletName.slice(0, 16), col5.x, currentY + 2, { width: col5.w, align: 'left', ellipsis: true })

      doc.fillColor(amountColor).font('Helvetica-Bold')
      doc.text(`${sign}${formatCurrency(Number(tx.amount))}`, col6.x, currentY + 2, { width: col6.w, align: 'right' })

      currentY += 16
    })

    // ── FOOTER WITH PAGE NUMBERS ──────────────────────────────
    const range = doc.bufferedPageRange()
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i)
      doc
        .fillColor(textMuted)
        .fontSize(7.5)
        .font('Helvetica')
        .text(
          `Dokumen ini dihasilkan secara otomatis oleh CashPlow (mop.my.id)   •   Halaman ${i + 1} dari ${range.count}`,
          36,
          800,
          { align: 'center', width: 523 }
        )
    }

    doc.end()
  })
}

function drawSummaryCard(doc: any, x: number, y: number, w: number, h: number, title: string, value: string, textColor: string, bgColor: string) {
  doc
    .roundedRect(x, y, w, h, 8)
    .fillAndStroke(bgColor, '#e2e8f0')

  doc
    .fillColor('#64748b')
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), x + 8, y + 8, { width: w - 16, align: 'left' })

  doc
    .fillColor(textColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(value, x + 8, y + 26, { width: w - 16, align: 'left' })
}

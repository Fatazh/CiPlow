// server/api/analytics/export.get.ts
// Export user financial data as an Excel (.xlsx) spreadsheet or JSON backup

import ExcelJS from 'exceljs'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)

  const monthParam = query.month ? String(query.month).toLowerCase() : null
  const yearParam = query.year ? String(query.year).toLowerCase() : null
  const format = query.format ? String(query.format).toLowerCase() : 'xlsx'
  const typeFilter = query.type ? String(query.type).toUpperCase() : null

  // Date filtering logic
  let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined
  let periodLabel = 'Semua_Waktu'

  const year = yearParam && !isNaN(Number(yearParam)) && Number(yearParam) > 2000 ? Number(yearParam) : null
  const month = monthParam && !isNaN(Number(monthParam)) && Number(monthParam) >= 1 && Number(monthParam) <= 12 ? Number(monthParam) : null

  const MONTH_NAMES_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  if (year && month) {
    // Specific month & year
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const end = new Date(year, month, 0, 23, 59, 59, 999)
    dateFilter = { gte: start, lte: end }
    periodLabel = `${MONTH_NAMES_ID[month - 1]}_${year}`
  } else if (year) {
    // Full year
    const start = new Date(year, 0, 1, 0, 0, 0, 0)
    const end = new Date(year, 11, 31, 23, 59, 59, 999)
    dateFilter = { gte: start, lte: end }
    periodLabel = `Tahun_${year}`
  }

  // Build where clause
  const whereClause: any = {
    userId: user.id,
  }
  if (dateFilter) {
    whereClause.date = dateFilter
  }
  if (typeFilter && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(typeFilter)) {
    whereClause.type = typeFilter
  }

  // Handle JSON backup format
  if (format === 'json') {
    const [wallets, categories, transactions, budgets, recurring] = await Promise.all([
      prisma.wallet.findMany({ where: { userId: user.id } }),
      prisma.category.findMany({ where: { userId: user.id } }),
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        include: { category: true, walletFrom: true, walletTo: true }
      }),
      prisma.budget.findMany({ where: { userId: user.id } }),
      prisma.recurringTransaction.findMany({ where: { userId: user.id } }),
    ])

    const exportData = {
      version: '1.2.1',
      appName: 'CashPlow',
      exportDate: new Date().toISOString(),
      period: periodLabel,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
      data: {
        wallets,
        categories,
        transactions,
        budgets,
        recurringTransactions: recurring,
      }
    }

    const filename = `CashPlow_Backup_${periodLabel}_${new Date().toISOString().slice(0, 10)}.json`
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
    setHeader(event, 'Cache-Control', 'no-cache')
    return exportData
  }

  // Handle XLSX Excel format
  const [transactions, userWallets, userCategories] = await Promise.all([
    prisma.transaction.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
      include: {
        category: true,
        walletFrom: true,
        walletTo: true,
      }
    }),
    prisma.wallet.findMany({ where: { userId: user.id } }),
    prisma.category.findMany({ where: { userId: user.id } }),
  ])

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'CashPlow Budget Tracker'
  workbook.lastModifiedBy = user.name || 'CashPlow User'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Sheet 1: Transaksi
  const txSheet = workbook.addWorksheet('Transaksi', {
    views: [{ showGridLines: true }]
  })

  // Define Columns
  // Notice Kolom B-G match what import.post.ts expects:
  // Kolom A: No
  // Kolom B: Tanggal (DD/MM/YYYY)
  // Kolom C: Keterangan
  // Kolom D: Kategori
  // Kolom E: Tipe (Masuk / Keluar / Transfer)
  // Kolom F: Dompet
  // Kolom G: Nominal
  // Kolom H: Catatan
  txSheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Tanggal', key: 'date', width: 15 },
    { header: 'Keterangan', key: 'description', width: 32 },
    { header: 'Kategori', key: 'category', width: 22 },
    { header: 'Tipe', key: 'type', width: 14 },
    { header: 'Dompet', key: 'wallet', width: 24 },
    { header: 'Nominal', key: 'amount', width: 20 },
    { header: 'Catatan', key: 'notes', width: 28 },
  ]

  // Style Header Row
  const headerRow = txSheet.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' } // Emerald green
    }
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'medium', color: { argb: 'FF059669' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    }
  })

  let totalIncome = 0
  let totalExpense = 0
  let totalTransfer = 0

  // Populate data rows
  transactions.forEach((tx, index) => {
    const rawAmount = Number(tx.amount)
    let typeLabel = 'Keluar'
    let walletName = tx.walletFrom?.name || '-'

    if (tx.type === 'INCOME') {
      typeLabel = 'Masuk'
      walletName = tx.walletTo?.name || '-'
      totalIncome += rawAmount
    } else if (tx.type === 'TRANSFER') {
      typeLabel = 'Transfer'
      walletName = `${tx.walletFrom?.name || '-'} -> ${tx.walletTo?.name || '-'}`
      totalTransfer += rawAmount
    } else {
      totalExpense += rawAmount
    }

    const txDate = new Date(tx.date)
    const formattedDate = `${String(txDate.getDate()).padStart(2, '0')}/${String(txDate.getMonth() + 1).padStart(2, '0')}/${txDate.getFullYear()}`

    const row = txSheet.addRow({
      no: index + 1,
      date: formattedDate,
      description: tx.description || '-',
      category: tx.category?.name || '-',
      type: typeLabel,
      wallet: walletName,
      amount: rawAmount,
      notes: tx.notes || '',
    })

    row.height = 22
    const isEven = index % 2 === 0
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF9FAFB'

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg }
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      }
      cell.font = { name: 'Calibri', size: 10 }
      cell.alignment = { vertical: 'middle' }

      if (colNumber === 1 || colNumber === 2 || colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      } else if (colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '#,##0'
        if (tx.type === 'INCOME') {
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF059669' }, bold: true }
        } else if (tx.type === 'EXPENSE') {
          cell.font = { name: 'Calibri', size: 10, color: { argb: 'FFE11D48' } }
        }
      }
    })
  })

  // Add summary row at bottom of Transaksi sheet if there are transactions
  if (transactions.length > 0) {
    const emptyRow = txSheet.addRow([])
    emptyRow.height = 10

    const summaryRow = txSheet.addRow({
      no: '',
      date: '',
      description: 'TOTAL BERSIH (NET)',
      category: '',
      type: '',
      wallet: '',
      amount: totalIncome - totalExpense,
      notes: `Pemasukan: ${totalIncome.toLocaleString('id-ID')} | Pengeluaran: ${totalExpense.toLocaleString('id-ID')}`
    })
    summaryRow.height = 24
    summaryRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11, bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF3F4F6' }
      }
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF9CA3AF' } },
        bottom: { style: 'double', color: { argb: 'FF4B5563' } }
      }
      if (colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
      }
      if (colNumber === 7) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' }
        cell.numFmt = '#,##0'
      }
    })
  }

  // Sheet 2: Ringkasan
  const summarySheet = workbook.addWorksheet('Ringkasan & Analisis', {
    views: [{ showGridLines: true }]
  })

  summarySheet.columns = [
    { width: 5 },
    { width: 30 },
    { width: 22 },
    { width: 28 },
    { width: 16 },
  ]

  // Title in Summary Sheet
  const titleRow = summarySheet.getRow(2)
  titleRow.getCell(2).value = 'RINGKASAN KEUANGAN CASFLOW'
  titleRow.getCell(2).font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF10B981' } }

  const infoRow1 = summarySheet.getRow(3)
  infoRow1.getCell(2).value = `Periode: ${periodLabel.replace(/_/g, ' ')}`
  infoRow1.getCell(2).font = { name: 'Calibri', size: 10, italic: true }

  const infoRow2 = summarySheet.getRow(4)
  infoRow2.getCell(2).value = `Pengguna: ${user.name} (${user.email})`
  infoRow2.getCell(2).font = { name: 'Calibri', size: 10, italic: true }

  // Overall Financial Stats Table
  const statHeaderRow = summarySheet.getRow(6)
  statHeaderRow.getCell(2).value = 'Indikator Keuangan'
  statHeaderRow.getCell(3).value = 'Nilai (IDR)'
  statHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
  statHeaderRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
  statHeaderRow.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  statHeaderRow.getCell(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  statHeaderRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
  statHeaderRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
  statHeaderRow.height = 24

  const statsData = [
    { label: 'Total Pemasukan', val: totalIncome, color: 'FF059669' },
    { label: 'Total Pengeluaran', val: totalExpense, color: 'FFE11D48' },
    { label: 'Selisih Bersih (Net Cash Flow)', val: totalIncome - totalExpense, color: totalIncome >= totalExpense ? 'FF059669' : 'FFE11D48' },
    { label: 'Total Transfer Antar Dompet', val: totalTransfer, color: 'FF3B82F6' },
    { label: 'Jumlah Total Transaksi', val: transactions.length, isCount: true },
  ]

  statsData.forEach((st, i) => {
    const row = summarySheet.getRow(7 + i)
    row.getCell(2).value = st.label
    row.getCell(3).value = st.val
    row.getCell(2).border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } }
    row.getCell(3).border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } }
    row.getCell(2).alignment = { vertical: 'middle' }
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'right' }
    if (!st.isCount) {
      row.getCell(3).numFmt = '#,##0'
    }
    if (st.color) {
      row.getCell(3).font = { bold: true, color: { argb: st.color } }
    }
  })

  // Category Breakdown Table
  const catStartRow = 14
  const catHeaderRow = summarySheet.getRow(catStartRow)
  catHeaderRow.getCell(2).value = 'Kategori'
  catHeaderRow.getCell(3).value = 'Tipe'
  catHeaderRow.getCell(4).value = 'Total Transaksi'
  catHeaderRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
  catHeaderRow.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
  catHeaderRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }
  catHeaderRow.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  catHeaderRow.getCell(3).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  catHeaderRow.getCell(4).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  catHeaderRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' }
  catHeaderRow.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
  catHeaderRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
  catHeaderRow.height = 24

  // Group by category
  const categoryTotals: Record<string, { name: string; type: string; total: number }> = {}
  transactions.forEach(tx => {
    if (tx.categoryId && tx.category) {
      const existing = categoryTotals[tx.categoryId]
      if (!existing) {
        categoryTotals[tx.categoryId] = {
          name: tx.category.name,
          type: tx.category.type,
          total: Number(tx.amount),
        }
      } else {
        existing.total += Number(tx.amount)
      }
    }
  })

  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.total - a.total)
  sortedCategories.forEach((cat, idx) => {
    const row = summarySheet.getRow(catStartRow + 1 + idx)
    row.getCell(2).value = cat.name
    row.getCell(3).value = cat.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'
    row.getCell(4).value = cat.total
    row.getCell(2).border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } }
    row.getCell(3).border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } }
    row.getCell(4).border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } }
    row.getCell(2).alignment = { vertical: 'middle' }
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'right' }
    row.getCell(4).numFmt = '#,##0'
  })

  // Generate buffer and send response
  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `CashPlow_Laporan_${periodLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`

  setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)
  setHeader(event, 'Cache-Control', 'no-cache')

  return Buffer.from(buffer)
})

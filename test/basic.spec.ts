import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'

describe('Basic Test Setup', () => {
  it('should run correctly', () => {
    expect(1 + 1).toBe(2)
  })
})

describe('Export Excel Feature', () => {
  it('should generate valid Excel workbook with Transaksi and Ringkasan sheets', async () => {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'CashPlow Budget Tracker'

    // Sheet 1: Transaksi
    const txSheet = workbook.addWorksheet('Transaksi', {
      views: [{ showGridLines: true }]
    })

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

    const mockTransactions = [
      {
        no: 1,
        date: '18/08/2026',
        description: 'Gaji Bulanan',
        category: 'Gaji',
        type: 'Masuk',
        wallet: 'Bank BCA',
        amount: 15000000,
        notes: 'Gaji pokok'
      },
      {
        no: 2,
        date: '18/08/2026',
        description: 'Belanja Supermarket',
        category: 'Belanja Bulanan',
        type: 'Keluar',
        wallet: 'Dompet Utama',
        amount: 350000,
        notes: 'Bahan makanan'
      }
    ]

    mockTransactions.forEach(tx => {
      txSheet.addRow(tx)
    })

    // Sheet 2: Ringkasan
    const summarySheet = workbook.addWorksheet('Ringkasan & Analisis')
    summarySheet.addRow(['Indikator Keuangan', 'Nilai (IDR)'])
    summarySheet.addRow(['Total Pemasukan', 15000000])
    summarySheet.addRow(['Total Pengeluaran', 350000])
    summarySheet.addRow(['Selisih Bersih (Net Cash Flow)', 14650000])

    const buffer = await workbook.xlsx.writeBuffer()
    expect(buffer).toBeDefined()
    expect(buffer.byteLength).toBeGreaterThan(1000)

    // Verify reading back the buffer
    const verifyWorkbook = new ExcelJS.Workbook()
    await verifyWorkbook.xlsx.load(buffer as any)

    const readTxSheet = verifyWorkbook.getWorksheet('Transaksi')
    expect(readTxSheet).toBeDefined()
    expect(readTxSheet?.rowCount).toBe(3) // 1 header + 2 data rows
    expect(readTxSheet?.getRow(2).getCell(3).value).toBe('Gaji Bulanan')
    expect(readTxSheet?.getRow(3).getCell(7).value).toBe(350000)

    const readSummarySheet = verifyWorkbook.getWorksheet('Ringkasan & Analisis')
    expect(readSummarySheet).toBeDefined()
    expect(readSummarySheet?.getRow(2).getCell(2).value).toBe(15000000)
  })
})


// server/api/transactions/import.post.ts
// Import transactions from an Excel file

import ExcelJS from 'exceljs'
import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { recalculateWalletBalance } from '~/server/utils/wallet'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  // Use readMultipartFormData to get the uploaded file
  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada file yang diunggah' })
  }

  const file = formData[0]
  if (!file || !file.filename?.endsWith('.xlsx')) {
    throw createError({ statusCode: 400, message: 'Format file harus .xlsx' })
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(file.data as any)
  const worksheet = workbook.getWorksheet(1)

  if (!worksheet) {
    throw createError({ statusCode: 400, message: 'File Excel kosong atau tidak valid' })
  }

  const transactionsToCreate: any[] = []
  const errors: string[] = []

  // Get user's categories and wallets for mapping
  const [userCategories, userWallets] = await Promise.all([
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.wallet.findMany({ where: { userId: user.id } }),
  ])

  // Iterate rows (starting from row 2 to skip header)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    try {
      const dateValue = row.getCell(2).value
      const description = row.getCell(3).value?.toString() || ''
      const categoryName = row.getCell(4).value?.toString() || ''
      const typeStr = row.getCell(5).value?.toString() || ''
      const walletName = row.getCell(6).value?.toString() || ''
      const amount = Number(row.getCell(7).value)

      // Basic Validation
      if (!dateValue || isNaN(amount) || amount <= 0) {
        errors.push(`Baris ${rowNumber}: Data tidak lengkap atau nominal tidak valid`)
        return
      }

      // Map Type
      let type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE'
      if (typeStr.toLowerCase().includes('masuk')) type = 'INCOME'
      else if (typeStr.toLowerCase().includes('transfer')) type = 'TRANSFER'

      // Map Category
      const category = userCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
      if (!category) {
        errors.push(`Baris ${rowNumber}: Kategori "${categoryName}" tidak ditemukan`)
        return
      }

      // Map Wallet
      const wallet = userWallets.find(w => w.name.toLowerCase() === walletName.toLowerCase())
      if (!wallet && type !== 'TRANSFER') {
        errors.push(`Baris ${rowNumber}: Dompet "${walletName}" tidak ditemukan`)
        return
      }

      transactionsToCreate.push({
        userId: user.id,
        date: new Date(dateValue as any),
        description,
        categoryId: category.id,
        type,
        amount,
        walletFromId: type === 'EXPENSE' ? wallet?.id : null,
        walletToId: type === 'INCOME' ? wallet?.id : null,
      })
    } catch (e) {
      errors.push(`Baris ${rowNumber}: Terjadi kesalahan format`)
    }
  })

  if (transactionsToCreate.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada data valid yang bisa diimpor. ' + (errors[0] || '') })
  }

  // Save to database in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const createdCount = await tx.transaction.createMany({
      data: transactionsToCreate
    })

    // Update budget spent for each
    for (const data of transactionsToCreate) {
      if (data.type === 'EXPENSE') {
        await updateBudgetSpent(tx, user.id, data.categoryId, data.date, data.amount)
      }
    }

    // Recalculate affected wallet balances once at the end
    const affectedWallets = new Set<string>()
    transactionsToCreate.forEach(t => {
      if (t.walletFromId) affectedWallets.add(t.walletFromId)
      if (t.walletToId) affectedWallets.add(t.walletToId)
    })

    for (const walletId of affectedWallets) {
      await recalculateWalletBalance(tx, walletId)
    }

    return createdCount
  })

  return { 
    ok: true, 
    message: `${result.count} transaksi berhasil diimpor`,
    errors: errors.length > 0 ? errors : null
  }
})

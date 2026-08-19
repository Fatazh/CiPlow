// server/api/transactions/restore.post.ts
// Restore entire database from a JSON backup file or payload

import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { recalculateWalletBalance } from '~/server/utils/wallet'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  let backupData: any = null

  // Check if multipart form data or json body
  const contentType = getHeader(event, 'content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await readMultipartFormData(event)
    if (!formData || formData.length === 0) {
      throw createError({ statusCode: 400, message: 'Tidak ada file backup yang diunggah' })
    }
    const file = formData[0]
    if (!file || !file.filename?.endsWith('.json')) {
      throw createError({ statusCode: 400, message: 'Format file cadangan harus .json' })
    }
    try {
      backupData = JSON.parse(file.data.toString('utf-8'))
    } catch {
      throw createError({ statusCode: 400, message: 'Format berkas JSON tidak valid atau rusak' })
    }
  } else {
    backupData = await readBody(event)
  }

  if (!backupData || !backupData.data) {
    throw createError({ statusCode: 400, message: 'Struktur file backup tidak sesuai format CashPlow' })
  }

  const { wallets = [], categories = [], transactions = [], budgets = [], recurringTransactions = [], savingsGoals = [], debts = [] } = backupData.data

  let stats = {
    walletsCount: 0,
    categoriesCount: 0,
    transactionsCount: 0,
    budgetsCount: 0,
    recurringCount: 0,
    savingsCount: 0,
    debtsCount: 0,
  }

  await prisma.$transaction(async (tx) => {
    // 1. Wallets mapping (Map existing by name, create if missing)
    const walletMap = new Map<string, string>() // oldId -> newId
    const existingWallets = await tx.wallet.findMany({ where: { userId: user.id } })

    for (const w of wallets) {
      const match = existingWallets.find((ew) => ew.name.toLowerCase() === w.name.toLowerCase())
      if (match) {
        walletMap.set(w.id, match.id)
      } else {
        const created = await tx.wallet.create({
          data: {
            name: w.name,
            type: w.type || 'CASH',
            balance: Number(w.balance) || 0,
            color: w.color || '#10b981',
            icon: w.icon || 'wallet',
            currency: w.currency || user.currency || 'IDR',
            isDefault: Boolean(w.isDefault),
            description: w.description || null,
            userId: user.id,
          },
        })
        walletMap.set(w.id, created.id)
        stats.walletsCount++
      }
    }

    // 2. Categories mapping (Map existing by name + type, create if missing)
    const categoryMap = new Map<string, string>() // oldId -> newId
    const existingCategories = await tx.category.findMany({ where: { userId: user.id } })

    for (const c of categories) {
      const match = existingCategories.find(
        (ec) => ec.name.toLowerCase() === c.name.toLowerCase() && ec.type === c.type
      )
      if (match) {
        categoryMap.set(c.id, match.id)
      } else {
        const created = await tx.category.create({
          data: {
            name: c.name,
            type: c.type,
            color: c.color || '#10b981',
            icon: c.icon || 'tag',
            isDefault: Boolean(c.isDefault),
            description: c.description || null,
            userId: user.id,
          },
        })
        categoryMap.set(c.id, created.id)
        stats.categoriesCount++
      }
    }

    // Fallback default category for safety
    let fallbackCategory = existingCategories[0]
    if (!fallbackCategory) {
      fallbackCategory = await tx.category.create({
        data: {
          name: 'Lainnya',
          type: 'EXPENSE',
          userId: user.id,
        },
      })
    }

    // 3. Transactions Restore
    for (const t of transactions) {
      const catId = categoryMap.get(t.categoryId) || fallbackCategory.id
      const wFromId = t.walletFromId ? (walletMap.get(t.walletFromId) || null) : null
      const wToId = t.walletToId ? (walletMap.get(t.walletToId) || null) : null

      await tx.transaction.create({
        data: {
          amount: Number(t.amount) || 0,
          type: t.type,
          description: t.description || null,
          notes: t.notes || null,
          date: t.date ? new Date(t.date) : new Date(),
          isPromo: Boolean(t.isPromo),
          promoType: t.promoType || null,
          promoValue: t.promoValue ? Number(t.promoValue) : null,
          promoDetails: t.promoDetails || null,
          quantity: t.quantity || 1,
          unitPrice: t.unitPrice ? Number(t.unitPrice) : null,
          userId: user.id,
          categoryId: catId,
          walletFromId: wFromId,
          walletToId: wToId,
        },
      })
      stats.transactionsCount++
    }

    // 4. Budgets Restore
    for (const b of budgets) {
      const catId = categoryMap.get(b.categoryId)
      if (!catId) continue

      const existingBudget = await tx.budget.findFirst({
        where: {
          userId: user.id,
          categoryId: catId,
          month: b.month,
          year: b.year,
        },
      })

      if (!existingBudget) {
        await tx.budget.create({
          data: {
            amount: Number(b.amount) || 0,
            spent: Number(b.spent) || 0,
            period: b.period || 'MONTHLY',
            month: b.month,
            year: b.year,
            isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
            userId: user.id,
            categoryId: catId,
          },
        })
        stats.budgetsCount++
      }
    }

    // 5. Recurring Transactions Restore
    for (const r of recurringTransactions) {
      const catId = categoryMap.get(r.categoryId) || fallbackCategory.id
      const wFromId = r.walletFromId ? (walletMap.get(r.walletFromId) || null) : null
      const wToId = r.walletToId ? (walletMap.get(r.walletToId) || null) : null

      await tx.recurringTransaction.create({
        data: {
          amount: Number(r.amount) || 0,
          type: r.type,
          description: r.description || null,
          notes: r.notes || null,
          interval: r.interval || 'MONTHLY',
          startDate: r.startDate ? new Date(r.startDate) : new Date(),
          nextDate: r.nextDate ? new Date(r.nextDate) : new Date(),
          endDate: r.endDate ? new Date(r.endDate) : null,
          isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
          userId: user.id,
          categoryId: catId,
          walletFromId: wFromId,
          walletToId: wToId,
        },
      })
      stats.recurringCount++
    }

    // 6. Savings Goals Restore
    for (const s of savingsGoals) {
      await tx.savingsGoal.create({
        data: {
          name: s.name,
          targetAmount: Number(s.targetAmount) || 0,
          currentAmount: Number(s.currentAmount) || 0,
          deadline: s.deadline ? new Date(s.deadline) : null,
          color: s.color || '#10b981',
          icon: s.icon || '🎯',
          isCompleted: Boolean(s.isCompleted),
          userId: user.id,
        },
      })
      stats.savingsCount++
    }

    // 7. Debts Restore
    for (const d of debts) {
      const createdDebt = await tx.debt.create({
        data: {
          type: d.type,
          personName: d.personName,
          totalAmount: Number(d.totalAmount) || 0,
          paidAmount: Number(d.paidAmount) || 0,
          dueDate: d.dueDate ? new Date(d.dueDate) : null,
          notes: d.notes || null,
          status: d.status || 'UNPAID',
          userId: user.id,
        },
      })
      stats.debtsCount++

      if (Array.isArray(d.payments)) {
        for (const p of d.payments) {
          const wId = p.walletId ? (walletMap.get(p.walletId) || null) : null
          await tx.debtPayment.create({
            data: {
              amount: Number(p.amount) || 0,
              date: p.date ? new Date(p.date) : new Date(),
              notes: p.notes || null,
              debtId: createdDebt.id,
              walletId: wId,
            },
          })
        }
      }
    }
  })

  // Recalculate wallet balances after transaction batch insertion
  const allUserWallets = await prisma.wallet.findMany({ where: { userId: user.id } })
  for (const w of allUserWallets) {
    await recalculateWalletBalance(prisma, w.id)
  }

  return {
    ok: true,
    message: '🎉 Data cadangan berhasil dipulihkan secara menyeluruh!',
    stats,
  }
})

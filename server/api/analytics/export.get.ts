// server/api/auth/export-data.get.ts
// Export all user data as a single JSON file for backup

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const [wallets, categories, transactions, budgets, recurring] = await Promise.all([
    prisma.wallet.findMany({ where: { userId: user.id } }),
    prisma.category.findMany({ where: { userId: user.id } }),
    prisma.transaction.findMany({ where: { userId: user.id } }),
    prisma.budget.findMany({ where: { userId: user.id } }),
    prisma.recurringTransaction.findMany({ where: { userId: user.id } }),
  ])

  const exportData = {
    version: '1.2.1',
    exportDate: new Date().toISOString(),
    user: {
      name: user.name,
      email: user.email,
      currency: user.currency,
    },
    data: {
      wallets,
      categories,
      transactions,
      budgets,
      recurringTransactions: recurring
    }
  }

  return exportData
})

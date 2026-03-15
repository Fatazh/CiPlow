// server/api/budgets/index.get.ts
// List budgets, optionally filtered by month/year

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
const query = getQuery(event) as { month?: string; year?: string }
  const now = new Date()
  const month = query.month ? parseInt(query.month) : now.getMonth() + 1
  const year = query.year ? parseInt(query.year) : now.getFullYear()

  // Get budgets with category info
  const budgets = await prisma.budget.findMany({
    where: {
      userId: user.id,
      month,
      year,
    },
    include: { category: true },
    orderBy: { amount: 'desc' },
  })

  // Calculate actual spent from transactions
  const curStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const curEnd = new Date(year, month, 0, 23, 59, 59, 999)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      type: 'EXPENSE',
      date: { gte: curStart, lte: curEnd },
    },
    select: { categoryId: true, amount: true },
  })

  const spentByCategory = new Map<string, number>()
  for (const tx of transactions) {
    spentByCategory.set(
      tx.categoryId,
      (spentByCategory.get(tx.categoryId) ?? 0) + Number(tx.amount),
    )
  }

  // Also get all EXPENSE categories to show which don't have budgets yet
  const expenseCategories = await prisma.category.findMany({
    where: { userId: user.id, type: 'EXPENSE' },
    orderBy: { name: 'asc' },
  })

  const budgetCategoryIds = new Set(budgets.map((b) => b.categoryId))
  const availableCategories = expenseCategories
    .filter((c) => !budgetCategoryIds.has(c.id))
    .map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
    }))

  return {
    ok: true,
    data: {
      month,
      year,
      budgets: budgets.map((b) => {
        const spent = spentByCategory.get(b.categoryId) ?? 0
        const budgeted = Number(b.amount)
        const remaining = budgeted - spent
        const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 1000) / 10 : 0

        return {
          id: b.id,
          categoryId: b.categoryId,
          category: b.category.name,
          icon: b.category.icon,
          color: b.category.color,
          budgeted,
          spent,
          remaining,
          percentage,
          period: b.period,
          isActive: b.isActive,
        }
      }),
      availableCategories,
    },
  }
})

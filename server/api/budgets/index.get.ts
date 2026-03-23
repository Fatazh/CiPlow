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
        const spent = Number(b.spent)
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

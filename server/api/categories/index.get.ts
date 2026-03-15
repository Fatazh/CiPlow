// server/api/categories/index.get.ts
// List all categories, optionally filtered by type

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
const query = getQuery(event) as { type?: string }

  const where: any = { userId: user.id }
  if (query.type === 'INCOME' || query.type === 'EXPENSE') {
    where.type = query.type
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    include: {
      _count: {
        select: { transactions: true, budgets: true },
      },
    },
  })

  return {
    ok: true,
    data: categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      color: c.color,
      icon: c.icon,
      description: c.description,
      isDefault: c.isDefault,
      transactionCount: c._count.transactions,
      budgetCount: c._count.budgets,
      createdAt: c.createdAt.toISOString(),
    })),
  }
})

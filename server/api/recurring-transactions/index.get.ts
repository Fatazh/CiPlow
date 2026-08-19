import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const recurringTransactions = await prisma.recurringTransaction.findMany({
    where: { userId: user.id },
    include: {
      category: true,
      walletFrom: true,
      walletTo: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    ok: true,
    data: recurringTransactions.map((rt) => ({
      id: rt.id,
      amount: Number(rt.amount),
      type: rt.type,
      description: rt.description,
      notes: rt.notes,
      interval: rt.interval,
      startDate: rt.startDate.toISOString(),
      nextDate: rt.nextDate.toISOString(),
      endDate: rt.endDate ? rt.endDate.toISOString() : null,
      isActive: rt.isActive,
      categoryId: rt.categoryId,
      category: rt.category.name,
      categoryIcon: rt.category.icon,
      categoryColor: rt.category.color,
      walletFromId: rt.walletFromId,
      walletFrom: rt.walletFrom?.name ?? null,
      walletToId: rt.walletToId,
      walletTo: rt.walletTo?.name ?? null,
    }))
  }
})

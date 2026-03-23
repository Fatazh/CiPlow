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
      interval: rt.interval,
      nextDate: rt.nextDate.toISOString(),
      endDate: rt.endDate ? rt.endDate.toISOString() : null,
      isActive: rt.isActive,
      category: rt.category.name,
      walletFrom: rt.walletFrom?.name ?? null,
      walletTo: rt.walletTo?.name ?? null,
    }))
  }
})

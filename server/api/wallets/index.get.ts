// server/api/wallets/index.get.ts
// List all wallets for the current user

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    include: {
      _count: {
        select: {
          transactionsFrom: true,
          transactionsTo: true,
        },
      },
    },
  })

  return {
    ok: true,
    data: wallets.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.type,
      balance: Number(w.balance),
      color: w.color,
      icon: w.icon,
      isDefault: w.isDefault,
      description: w.description,
      transactionCount: w._count.transactionsFrom + w._count.transactionsTo,
      createdAt: w.createdAt.toISOString(),
    })),
  }
})

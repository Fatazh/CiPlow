// server/api/transactions/[id].get.ts
// Get a single transaction by ID

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
const tx = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
    include: {
      category: true,
      walletFrom: true,
      walletTo: true,
    },
  })

  if (!tx) throw createError({ statusCode: 404, message: 'Transaksi tidak ditemukan' })

  return {
    ok: true,
    data: {
      id: tx.id,
      amount: Number(tx.amount),
      type: tx.type,
      description: tx.description,
      notes: tx.notes,
      date: tx.date.toISOString(),
      quantity: tx.quantity,
      unitPrice: tx.unitPrice ? Number(tx.unitPrice) : null,
      isPromo: tx.isPromo,
      promoType: tx.promoType,
      promoValue: tx.promoValue ? Number(tx.promoValue) : null,
      promoDetails: tx.promoDetails,
      categoryId: tx.categoryId,
      category: {
        id: tx.category.id,
        name: tx.category.name,
        icon: tx.category.icon,
        color: tx.category.color,
        type: tx.category.type,
      },
      walletFromId: tx.walletFromId,
      walletFrom: tx.walletFrom
        ? { id: tx.walletFrom.id, name: tx.walletFrom.name, type: tx.walletFrom.type, color: tx.walletFrom.color }
        : null,
      walletToId: tx.walletToId,
      walletTo: tx.walletTo
        ? { id: tx.walletTo.id, name: tx.walletTo.name, type: tx.walletTo.type, color: tx.walletTo.color }
        : null,
    },
  }
})

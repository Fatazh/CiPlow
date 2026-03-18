// server/api/transactions/[id].delete.ts
// Delete a transaction + reverse wallet balance changes

import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Transaksi tidak ditemukan' })

  const amount = Number(existing.amount)

  await prisma.$transaction(async (tx) => {
    // Reverse wallet balance changes
    if (existing.type === 'EXPENSE' && existing.walletFromId) {
      await tx.wallet.update({
        where: { id: existing.walletFromId },
        data: { balance: { increment: amount } },
      })
      // Reverse budget spent
      await updateBudgetSpent(tx, user.id, existing.categoryId, existing.date, -amount)
    } else if (existing.type === 'INCOME' && existing.walletToId) {
      await tx.wallet.update({
        where: { id: existing.walletToId },
        data: { balance: { decrement: amount } },
      })
    } else if (existing.type === 'TRANSFER') {
      if (existing.walletFromId) {
        await tx.wallet.update({
          where: { id: existing.walletFromId },
          data: { balance: { increment: amount } },
        })
      }
      if (existing.walletToId) {
        await tx.wallet.update({
          where: { id: existing.walletToId },
          data: { balance: { decrement: amount } },
        })
      }
    }

    // Delete the transaction
    await tx.transaction.delete({ where: { id } })
  })

  return { ok: true, message: 'Transaksi berhasil dihapus' }
})

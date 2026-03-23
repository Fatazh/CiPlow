// server/api/transactions/[id].delete.ts
// Delete a transaction + reverse wallet balance changes

import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { recalculateWalletBalance } from '~/server/utils/wallet'

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
    // Reverse budget spent (only for EXPENSE)
    if (existing.type === 'EXPENSE') {
      await updateBudgetSpent(tx, user.id, existing.categoryId, existing.date, -amount)
    }

    // Delete the transaction
    await tx.transaction.delete({ where: { id } })

    // Recalculate affected wallet balances
    if (existing.walletFromId) {
      await recalculateWalletBalance(tx, existing.walletFromId)
    }
    if (existing.walletToId) {
      await recalculateWalletBalance(tx, existing.walletToId)
    }
  })

  return { ok: true, message: 'Transaksi berhasil dihapus' }
})

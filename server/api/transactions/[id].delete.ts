// server/api/transactions/[id].delete.ts
// Delete a transaction + reverse wallet balance changes

import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { adjustWalletBalance } from '~/server/utils/wallet'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Transaksi tidak ditemukan' })

  const amount = Number(existing.amount)
  const targetAmount = existing.targetAmount ? Number(existing.targetAmount) : amount

  await prisma.$transaction(async (tx) => {
    // Reverse budget spent (only for EXPENSE)
    if (existing.type === 'EXPENSE') {
      await updateBudgetSpent(tx, user.id, existing.categoryId, existing.date, -amount)
    }

    // Delete the transaction
    await tx.transaction.delete({ where: { id } })

    // Reverse wallet balances incrementally
    if (existing.walletFromId) {
      // Money was LEAVING, so we ADD it back
      await adjustWalletBalance(tx, existing.walletFromId, amount)
    }
    if (existing.walletToId) {
      // Money was ENTERING, so we SUBTRACT it
      const amountToRemove = existing.type === 'TRANSFER' ? targetAmount : amount
      await adjustWalletBalance(tx, existing.walletToId, -amountToRemove)
    }
  })

  return { ok: true, message: 'Transaksi berhasil dihapus' }
})


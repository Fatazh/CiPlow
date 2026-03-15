// server/api/wallets/[id].delete.ts
// Delete a wallet

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
// Verify ownership + check relations
  const existing = await prisma.wallet.findFirst({
    where: { id, userId: user.id },
    include: {
      _count: {
        select: {
          transactionsFrom: true,
          transactionsTo: true,
        },
      },
    },
  })

  if (!existing) throw createError({ statusCode: 404, message: 'Wallet tidak ditemukan' })

  const txCount = existing._count.transactionsFrom + existing._count.transactionsTo
  if (txCount > 0) {
    throw createError({
      statusCode: 409,
      message: `Wallet ini memiliki ${txCount} transaksi. Hapus transaksi terlebih dahulu atau pindahkan ke wallet lain.`,
    })
  }

  await prisma.wallet.delete({ where: { id } })

  return { ok: true, message: 'Wallet berhasil dihapus' }
})

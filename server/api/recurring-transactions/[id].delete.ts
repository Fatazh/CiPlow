// server/api/recurring-transactions/[id].delete.ts
// Delete recurring transaction rule

import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID transaksi berulang diperlukan' })

  const existing = await prisma.recurringTransaction.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Jadwal transaksi berulang tidak ditemukan' })
  }

  await prisma.recurringTransaction.delete({
    where: { id },
  })

  return { ok: true, message: 'Jadwal transaksi berulang berhasil dihapus' }
})

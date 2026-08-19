// server/api/recurring-transactions/[id]/toggle.patch.ts
// Toggle isActive state (Pause or Resume recurring transaction)

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

  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
  })

  return {
    ok: true,
    message: updated.isActive ? 'Transaksi berulang diaktifkan kembali' : 'Transaksi berulang berhasil dijeda',
    data: updated,
  }
})

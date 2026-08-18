// server/api/debts/[id].delete.ts
// Delete a debt or loan record

import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)

  const existing = await prisma.debt.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Catatan tidak ditemukan' })

  await prisma.debt.delete({ where: { id } })

  return { ok: true, message: 'Catatan hutang/piutang berhasil dihapus' }
})

// server/api/savings-goals/[id].delete.ts
// Delete a savings goal

import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)

  const existing = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Target tabungan tidak ditemukan' })

  await prisma.savingsGoal.delete({ where: { id } })

  return { ok: true, message: 'Target tabungan berhasil dihapus' }
})

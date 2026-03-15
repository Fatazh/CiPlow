// server/api/budgets/[id].delete.ts
// Delete a budget

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
const existing = await prisma.budget.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })

  await prisma.budget.delete({ where: { id } })

  return { ok: true, message: 'Budget berhasil dihapus' }
})

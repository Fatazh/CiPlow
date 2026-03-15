// server/api/categories/[id].delete.ts
// Delete a category

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
const existing = await prisma.category.findFirst({
    where: { id, userId: user.id },
    include: {
      _count: {
        select: { transactions: true, budgets: true },
      },
    },
  })

  if (!existing) throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan' })

  if (existing.isDefault) {
    throw createError({
      statusCode: 409,
      message: 'Kategori default tidak bisa dihapus',
    })
  }

  if (existing._count.transactions > 0) {
    throw createError({
      statusCode: 409,
      message: `Kategori ini memiliki ${existing._count.transactions} transaksi. Pindahkan transaksi ke kategori lain terlebih dahulu.`,
    })
  }

  // Delete related budgets first, then category
  if (existing._count.budgets > 0) {
    await prisma.budget.deleteMany({ where: { categoryId: id } })
  }

  await prisma.category.delete({ where: { id } })

  return { ok: true, message: 'Kategori berhasil dihapus' }
})

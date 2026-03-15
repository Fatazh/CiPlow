// server/api/budgets/index.post.ts
// Create a new budget

import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  amount: z.number().positive('Nominal budget harus lebih dari 0'),
  month: z.number().min(1, 'Bulan tidak valid').max(12, 'Bulan tidak valid'),
  year: z.number().min(2020, 'Tahun tidak valid'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const result = await readValidatedBody(event, (body) => budgetSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  // Verify category exists and is EXPENSE type
  const category = await prisma.category.findFirst({
    where: { id: body.categoryId, userId: user.id },
  })

  if (!category) {
    throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan' })
  }

  if (category.type !== 'EXPENSE') {
    throw createError({ statusCode: 400, message: 'Budget hanya bisa untuk kategori pengeluaran' })
  }

  // Check for duplicate
  const existing = await prisma.budget.findFirst({
    where: {
      userId: user.id,
      categoryId: body.categoryId,
      month: body.month,
      year: body.year,
    },
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      message: 'Budget untuk kategori dan bulan ini sudah ada',
    })
  }

  const budget = await prisma.budget.create({
    data: {
      amount: body.amount,
      month: body.month,
      year: body.year,
      period: (body.period as any) ?? 'MONTHLY',
      userId: user.id,
      categoryId: body.categoryId,
    },
    include: { category: true },
  })

  return {
    ok: true,
    data: {
      id: budget.id,
      categoryId: budget.categoryId,
      category: budget.category.name,
      icon: budget.category.icon,
      color: budget.category.color,
      budgeted: Number(budget.amount),
      spent: 0,
      remaining: Number(budget.amount),
      percentage: 0,
    },
  }
})

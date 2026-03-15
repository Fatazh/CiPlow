// server/api/budgets/[id].put.ts
// Update a budget's amount

import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const budgetUpdateSchema = z.object({
  amount: z.number().positive('Nominal budget harus lebih dari 0').optional(),
  isActive: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
const existing = await prisma.budget.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Budget tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => budgetUpdateSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  const budget = await prisma.budget.update({
    where: { id },
    data: {
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: { category: true },
  })

  return {
    ok: true,
    data: {
      id: budget.id,
      categoryId: budget.categoryId,
      category: budget.category.name,
      budgeted: Number(budget.amount),
      isActive: budget.isActive,
    },
  }
})

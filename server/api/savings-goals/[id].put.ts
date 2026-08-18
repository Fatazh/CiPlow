// server/api/savings-goals/[id].put.ts
// Update a savings goal

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

const updateGoalSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().optional().nullable(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isCompleted: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)

  const existing = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Target tabungan tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => updateGoalSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }

  const data = result.data
  const target = data.targetAmount ?? Number(existing.targetAmount)
  const current = data.currentAmount ?? Number(existing.currentAmount)
  const isCompleted = data.isCompleted ?? current >= target

  const updated = await prisma.savingsGoal.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name.trim() }),
      ...(data.targetAmount !== undefined && { targetAmount: data.targetAmount }),
      ...(data.currentAmount !== undefined && { currentAmount: data.currentAmount }),
      ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
      ...(data.color && { color: data.color }),
      ...(data.icon && { icon: data.icon }),
      isCompleted,
    },
  })

  return {
    ok: true,
    message: 'Target tabungan berhasil diperbarui!',
    data: {
      id: updated.id,
      name: updated.name,
      targetAmount: Number(updated.targetAmount),
      currentAmount: Number(updated.currentAmount),
      isCompleted: updated.isCompleted,
    },
  }
})

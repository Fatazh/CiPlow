// server/api/savings-goals/index.post.ts
// Create a new savings goal

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Nama target tabungan harus diisi').max(50, 'Nama target maksimal 50 karakter'),
  targetAmount: z.number().positive('Nominal target harus lebih dari 0'),
  currentAmount: z.number().min(0, 'Saldo awal tabungan tidak boleh negatif').optional().default(0),
  deadline: z.string().optional().nullable(),
  color: z.string().optional().default('#10b981'),
  icon: z.string().optional().default('🎯'),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const result = await readValidatedBody(event, (body) => savingsGoalSchema.safeParse(body))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message || 'Input tidak valid',
    })
  }

  const { name, targetAmount, currentAmount, deadline, color, icon } = result.data

  const goal = await prisma.savingsGoal.create({
    data: {
      name: name.trim(),
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: deadline ? new Date(deadline) : null,
      color,
      icon,
      isCompleted: currentAmount >= targetAmount,
      userId: user.id,
    },
  })

  return {
    ok: true,
    message: 'Target tabungan berhasil dibuat! 🎯',
    data: {
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      deadline: goal.deadline ? goal.deadline.toISOString() : null,
      color: goal.color,
      icon: goal.icon,
      isCompleted: goal.isCompleted,
    },
  }
})

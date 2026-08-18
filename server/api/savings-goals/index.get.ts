// server/api/savings-goals/index.get.ts
// Get all savings goals for the logged-in user

import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    orderBy: [
      { isCompleted: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return {
    ok: true,
    data: goals.map((g: any) => {
      const target = Number(g.targetAmount)
      const current = Number(g.currentAmount)
      const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
      const remaining = Math.max(0, target - current)

      return {
        id: g.id,
        name: g.name,
        targetAmount: target,
        currentAmount: current,
        percentage,
        remaining,
        deadline: g.deadline ? g.deadline.toISOString().split('T')[0] : null,
        color: g.color,
        icon: g.icon,
        isCompleted: g.isCompleted || percentage >= 100,
        createdAt: g.createdAt.toISOString(),
      }
    }),
  }
})

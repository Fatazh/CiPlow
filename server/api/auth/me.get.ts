// server/api/auth/me.get.ts
// Get current authenticated user and their stats

import { getUserFromSession } from '~/server/utils/auth'
import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try{
  const user = await getUserFromSession(event)

  if (!user) {
    setResponseStatus(event, 401)
    return { ok: false, message: 'Belum login' }
  }

  // Get quick stats
  const [txCount, catCount, walletCount, budgetCount] = await Promise.all([
    prisma.transaction.count({ where: { userId: user.id } }),
    prisma.category.count({ where: { userId: user.id } }),
    prisma.wallet.count({ where: { userId: user.id } }),
    prisma.budget.count({ where: { userId: user.id } }),
  ])

  return {
    ok: true,
    data: {
      ...user,
      stats: {
        transactions: txCount,
        categories: catCount,
        wallets: walletCount,
        budgets: budgetCount,
      }
    },
  }
  }catch(err){
    console.error('[me.get] Unhandled error:', err)
        setResponseStatus(event, 500)
        return { ok: false, message: 'Server error' }
  }
})

// server/api/savings-goals/[id]/deposit.post.ts
// Deposit or withdraw amount for a savings goal (optionally from a wallet)

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { adjustWalletBalance } from '~/server/utils/wallet'

const depositSchema = z.object({
  amount: z.number().positive('Nominal harus lebih dari 0'),
  action: z.enum(['DEPOSIT', 'WITHDRAW']).default('DEPOSIT'),
  walletId: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID target diperlukan' })

  const user = await requireAuth(event)

  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: user.id },
  })
  if (!goal) throw createError({ statusCode: 404, message: 'Target tabungan tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => depositSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }

  const { amount, action, walletId } = result.data

  const updatedGoal = await prisma.$transaction(async (tx) => {
    let wallet = null
    if (walletId) {
      wallet = await tx.wallet.findFirst({ where: { id: walletId, userId: user.id } })
      if (!wallet) throw createError({ statusCode: 404, message: 'Dompet tidak ditemukan' })

      if (action === 'DEPOSIT') {
        if (Number(wallet.balance) < amount) {
          throw createError({ statusCode: 400, message: `Saldo di dompet ${wallet.name} tidak mencukupi (${Number(wallet.balance)})` })
        }
        // Deduct from wallet
        await adjustWalletBalance(tx, walletId, -amount)
      } else if (action === 'WITHDRAW') {
        // Return to wallet
        await adjustWalletBalance(tx, walletId, amount)
      }
    }

    const current = Number(goal.currentAmount)
    const target = Number(goal.targetAmount)
    const newCurrent = action === 'DEPOSIT' ? current + amount : Math.max(0, current - amount)
    const isCompleted = newCurrent >= target

    return tx.savingsGoal.update({
      where: { id },
      data: {
        currentAmount: newCurrent,
        isCompleted,
      },
    })
  })

  const newAmount = Number(updatedGoal.currentAmount)
  const target = Number(updatedGoal.targetAmount)
  const pct = Math.min(100, Math.round((newAmount / target) * 100))

  return {
    ok: true,
    message: action === 'DEPOSIT'
      ? (newAmount >= target ? '🎉 Selamat! Target tabungan Anda telah tercapai 100%!' : 'Setoran tabungan berhasil ditambahkan! 💰')
      : 'Penarikan saldo tabungan berhasil dilakukan.',
    data: {
      id: updatedGoal.id,
      currentAmount: newAmount,
      percentage: pct,
      isCompleted: updatedGoal.isCompleted,
    },
  }
})

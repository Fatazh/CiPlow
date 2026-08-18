// server/api/debts/[id]/pay.post.ts
// Record an installment or full payoff payment for a debt/loan

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { adjustWalletBalance } from '~/server/utils/wallet'

const payDebtSchema = z.object({
  amount: z.number().positive('Nominal pembayaran harus lebih dari 0'),
  date: z.string().optional(),
  notes: z.string().optional().nullable(),
  walletId: z.string().optional().nullable(), // Optional: mutate wallet balance
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID catatan diperlukan' })

  const user = await requireAuth(event)

  const debt = await prisma.debt.findFirst({
    where: { id, userId: user.id },
  })
  if (!debt) throw createError({ statusCode: 404, message: 'Catatan hutang/piutang tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => payDebtSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }

  const { amount, date, notes, walletId } = result.data

  const currentPaid = Number(debt.paidAmount)
  const total = Number(debt.totalAmount)
  const remaining = total - currentPaid

  if (amount > remaining) {
    throw createError({
      statusCode: 400,
      message: `Nominal pembayaran melebihi sisa tagihan (${remaining})`,
    })
  }

  const updatedDebt = await prisma.$transaction(async (tx) => {
    // If wallet is specified
    if (walletId) {
      const wallet = await tx.wallet.findFirst({ where: { id: walletId, userId: user.id } })
      if (!wallet) throw createError({ statusCode: 404, message: 'Dompet tidak ditemukan' })

      if (debt.type === 'LEND') {
        // Person pays us back -> money enters our wallet
        await adjustWalletBalance(tx, walletId, amount)
      } else if (debt.type === 'BORROW') {
        // We pay our debt to someone -> money leaves our wallet
        if (Number(wallet.balance) < amount) {
          throw createError({ statusCode: 400, message: `Saldo di dompet ${wallet.name} tidak cukup (${Number(wallet.balance)})` })
        }
        await adjustWalletBalance(tx, walletId, -amount)
      }
    }

    // Record payment log
    await tx.debtPayment.create({
      data: {
        debtId: id,
        amount,
        date: date ? new Date(date) : new Date(),
        notes: notes?.trim() || null,
        walletId: walletId || null,
      },
    })

    const newPaid = currentPaid + amount
    const newStatus = newPaid >= total ? 'PAID' : 'PARTIAL'

    return tx.debt.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        status: newStatus,
      },
    })
  })

  const newPaidAmount = Number(updatedDebt.paidAmount)
  const isPaidOff = newPaidAmount >= total

  return {
    ok: true,
    message: isPaidOff
      ? (debt.type === 'LEND' ? '🎉 Piutang telah lunas dibayar!' : '🎉 Hutang telah lunas terbayar!')
      : 'Pembayaran cicilan berhasil dicatat! 💵',
    data: {
      id: updatedDebt.id,
      paidAmount: newPaidAmount,
      status: updatedDebt.status,
      isCompleted: isPaidOff,
    },
  }
})

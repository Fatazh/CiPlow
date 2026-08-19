// server/api/debts/index.post.ts
// Create a new Debt or Loan record

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'
import { adjustWalletBalance } from '~/server/utils/wallet'

const createDebtSchema = z.object({
  type: z.enum(['LEND', 'BORROW']),
  personName: z.string().min(1, 'Nama orang / pihak wajib diisi').max(50),
  totalAmount: z.number().positive('Nominal harus lebih dari 0'),
  initialPaid: z.number().min(0).optional().default(0),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  walletId: z.string().optional().nullable(), // Optional: if provided, mutate wallet balance
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const result = await readValidatedBody(event, (body) => createDebtSchema.safeParse(body))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message || 'Input tidak valid',
    })
  }

  const { type, personName, totalAmount, initialPaid = 0, dueDate, notes, walletId } = result.data

  if (initialPaid > totalAmount) {
    throw createError({
      statusCode: 400,
      message: `Pembayaran awal (${initialPaid}) tidak boleh melebihi total tagihan (${totalAmount})`,
    })
  }

  const status = initialPaid >= totalAmount ? 'PAID' : (initialPaid > 0 ? 'PARTIAL' : 'UNPAID')

  const debt = await prisma.$transaction(async (tx) => {
    // If wallet is specified and money moved right now
    if (walletId) {
      const wallet = await tx.wallet.findFirst({ where: { id: walletId, userId: user.id } })
      if (!wallet) throw createError({ statusCode: 404, message: 'Dompet tidak ditemukan' })

      if (type === 'LEND') {
        // We lend money to someone -> money leaves our wallet
        if (Number(wallet.balance) < totalAmount) {
          throw createError({ statusCode: 400, message: `Saldo di dompet ${wallet.name} tidak cukup (${Number(wallet.balance)})` })
        }
        await adjustWalletBalance(tx, walletId, -totalAmount)
      } else if (type === 'BORROW') {
        // We borrow money from someone -> money enters our wallet
        await adjustWalletBalance(tx, walletId, totalAmount)
      }
    }

    const created = await tx.debt.create({
      data: {
        type,
        personName: personName.trim(),
        totalAmount,
        paidAmount: initialPaid || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes ? notes.trim() : null,
        status,
        userId: user.id,
      },
    })

    // If initial paid was provided, record initial payment
    if (initialPaid > 0) {
      await tx.debtPayment.create({
        data: {
          debtId: created.id,
          amount: initialPaid,
          notes: 'Pembayaran awal',
        },
      })
    }

    return created
  })

  return {
    ok: true,
    message: type === 'LEND' ? 'Catatan piutang berhasil dibuat! 🤝' : 'Catatan hutang berhasil dibuat! 📝',
    data: {
      id: debt.id,
      type: debt.type,
      personName: debt.personName,
      totalAmount: Number(debt.totalAmount),
      paidAmount: Number(debt.paidAmount),
      status: debt.status,
    },
  }
})

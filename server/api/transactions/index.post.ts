// server/api/transactions/index.post.ts
// Create a new transaction + auto-update wallet balance

import { z } from 'zod'
import { PromoType } from '@prisma/client'
import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'

const transactionSchema = z.object({
  amount: z.number().positive('Nominal harus lebih dari 0'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], { message: 'Tipe transaksi tidak valid' }),
  description: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  walletFromId: z.string().optional(),
  walletToId: z.string().optional(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  isPromo: z.boolean().optional(),
  promoType: z.nativeEnum(PromoType).optional(),
  promoValue: z.number().optional(),
  promoDetails: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const result = await readValidatedBody(event, (body) => transactionSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  // Wallet validation based on type
  if (body.type === 'EXPENSE' && !body.walletFromId) {
    throw createError({ statusCode: 400, message: 'Pilih dompet sumber untuk pengeluaran' })
  }
  if (body.type === 'INCOME' && !body.walletToId) {
    throw createError({ statusCode: 400, message: 'Pilih dompet tujuan untuk pemasukan' })
  }
  if (body.type === 'TRANSFER') {
    if (!body.walletFromId || !body.walletToId) {
      throw createError({ statusCode: 400, message: 'Pilih dompet asal dan tujuan untuk transfer' })
    }
    if (body.walletFromId === body.walletToId) {
      throw createError({ statusCode: 400, message: 'Dompet asal dan tujuan harus berbeda' })
    }
  }

  // Verify category
  const category = await prisma.category.findFirst({
    where: { id: body.categoryId, userId: user.id },
  })
  if (!category) {
    throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan' })
  }

  // ── Validation: Category Type Match ─────────────────────────
  if (body.type === 'INCOME' && category.type !== 'INCOME') {
    throw createError({ statusCode: 400, message: 'Transaksi pemasukan harus menggunakan kategori bertipe Pemasukan' })
  }
  if (body.type === 'EXPENSE' && category.type !== 'EXPENSE') {
    throw createError({ statusCode: 400, message: 'Transaksi pengeluaran harus menggunakan kategori bertipe Pengeluaran' })
  }

  // Verify wallets exist and check balance
  const amount = body.amount

  if (body.walletFromId) {
    const w = await prisma.wallet.findFirst({ where: { id: body.walletFromId, userId: user.id } })
    if (!w) throw createError({ statusCode: 404, message: 'Dompet sumber tidak ditemukan' })
    
    // Check for sufficient balance (for EXPENSE and TRANSFER)
    if ((body.type === 'EXPENSE' || body.type === 'TRANSFER') && Number(w.balance) < amount) {
      throw createError({ 
        statusCode: 400, 
        message: `Saldo tidak mencukupi. Saldo saat ini: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(w.balance))}` 
      })
    }
  }
  if (body.walletToId) {
    const w = await prisma.wallet.findFirst({ where: { id: body.walletToId, userId: user.id } })
    if (!w) throw createError({ statusCode: 404, message: 'Dompet tujuan tidak ditemukan' })
  }

  // ── Create transaction + update wallet balances in a transaction ──
  const txDate = body.date ? new Date(body.date) : new Date()

  const txResult = await prisma.$transaction(async (tx) => {
    // Create the transaction
    const transaction = await tx.transaction.create({
      data: {
        amount,
        type: body.type,
        description: body.description?.trim() || null,
        notes: body.notes?.trim() || null,
        date: txDate,
        userId: user.id,
        categoryId: body.categoryId,
        walletFromId: body.walletFromId || null,
        walletToId: body.walletToId || null,
        // Detail fields
        quantity: body.quantity || 1,
        unitPrice: body.unitPrice || null,
        // Promo fields
        isPromo: body.isPromo || false,
        promoType: body.promoType || null,
        promoValue: body.promoValue || null,
        promoDetails: body.promoDetails?.trim() || null,
      },
      include: {
        category: true,
        walletFrom: true,
        walletTo: true,
      },
    })

    // Update wallet balances
    if (body.type === 'EXPENSE' && body.walletFromId) {
      await tx.wallet.update({
        where: { id: body.walletFromId },
        data: { balance: { decrement: amount } },
      })
      // Update budget 'spent' amount
      await updateBudgetSpent(tx, user.id, body.categoryId, txDate, amount)
    } else if (body.type === 'INCOME' && body.walletToId) {
      await tx.wallet.update({
        where: { id: body.walletToId },
        data: { balance: { increment: amount } },
      })
    } else if (body.type === 'TRANSFER') {
      await tx.wallet.update({
        where: { id: body.walletFromId! },
        data: { balance: { decrement: amount } },
      })
      await tx.wallet.update({
        where: { id: body.walletToId! },
        data: { balance: { increment: amount } },
      })
    }

    return transaction
  })

  return {
    ok: true,
    data: {
      id: txResult.id,
      amount: Number(txResult.amount),
      type: txResult.type,
      description: txResult.description,
      date: txResult.date.toISOString(),
      category: txResult.category.name,
      walletFrom: txResult.walletFrom?.name ?? null,
      walletTo: txResult.walletTo?.name ?? null,
    }
  }
})

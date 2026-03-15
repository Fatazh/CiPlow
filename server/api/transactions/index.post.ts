// server/api/transactions/index.post.ts
// Create a new transaction + auto-update wallet balance

import { z } from 'zod'
import { PromoType } from '@prisma/client'
import prisma from '~/server/utils/prisma'

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

  // Verify wallets exist
  if (body.walletFromId) {
    const w = await prisma.wallet.findFirst({ where: { id: body.walletFromId, userId: user.id } })
    if (!w) throw createError({ statusCode: 404, message: 'Dompet sumber tidak ditemukan' })
  }
  if (body.walletToId) {
    const w = await prisma.wallet.findFirst({ where: { id: body.walletToId, userId: user.id } })
    if (!w) throw createError({ statusCode: 404, message: 'Dompet tujuan tidak ditemukan' })
  }

  // ── Create transaction + update wallet balances in a transaction ──
  const amount = body.amount
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

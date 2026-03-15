// server/api/transactions/[id].put.ts
// Update a transaction + atomic wallet balance reversal & re-application

import { z } from 'zod'
import { PromoType } from '@prisma/client'
import prisma from '~/server/utils/prisma'

const transactionUpdateSchema = z.object({
  amount: z.number().positive('Nominal harus lebih dari 0').optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], { message: 'Tipe transaksi tidak valid' }).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional(),
  categoryId: z.string().optional(),
  walletFromId: z.string().nullable().optional(),
  walletToId: z.string().nullable().optional(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  isPromo: z.boolean().optional(),
  promoType: z.nativeEnum(PromoType).optional(),
  promoValue: z.number().optional(),
  promoDetails: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
// Get existing transaction
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Transaksi tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => transactionUpdateSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  // ── Validation ──────────────────────────────────────────────
  const newAmount = body.amount ?? Number(existing.amount)
  const newType = body.type ?? existing.type
  const newCategoryId = body.categoryId ?? existing.categoryId
  const newWalletFromId = body.walletFromId !== undefined ? body.walletFromId : existing.walletFromId
  const newWalletToId = body.walletToId !== undefined ? body.walletToId : existing.walletToId

  if (newAmount <= 0) {
    throw createError({ statusCode: 400, message: 'Nominal harus lebih dari 0' })
  }

  if (!['INCOME', 'EXPENSE', 'TRANSFER'].includes(newType)) {
    throw createError({ statusCode: 400, message: 'Tipe transaksi tidak valid' })
  }

  // Wallet validation based on type
  if (newType === 'EXPENSE' && !newWalletFromId) {
    throw createError({ statusCode: 400, message: 'Pilih dompet sumber untuk pengeluaran' })
  }
  if (newType === 'INCOME' && !newWalletToId) {
    throw createError({ statusCode: 400, message: 'Pilih dompet tujuan untuk pemasukan' })
  }
  if (newType === 'TRANSFER') {
    if (!newWalletFromId || !newWalletToId) {
      throw createError({ statusCode: 400, message: 'Pilih dompet asal dan tujuan untuk transfer' })
    }
    if (newWalletFromId === newWalletToId) {
      throw createError({ statusCode: 400, message: 'Dompet asal dan tujuan harus berbeda' })
    }
  }

  // Verify category
  if (body.categoryId) {
    const cat = await prisma.category.findFirst({ where: { id: body.categoryId, userId: user.id } })
    if (!cat) throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan' })
  }

  const oldAmount = Number(existing.amount)
  const oldType = existing.type
  const oldWalletFromId = existing.walletFromId
  const oldWalletToId = existing.walletToId

  // ── Atomic: reverse old balances → update transaction → apply new balances ──
  const txResult = await prisma.$transaction(async (tx) => {

    // ── Step 1: Reverse old transaction's effect ──────────────
    if (oldType === 'EXPENSE' && oldWalletFromId) {
      await tx.wallet.update({
        where: { id: oldWalletFromId },
        data: { balance: { increment: oldAmount } },
      })
    } else if (oldType === 'INCOME' && oldWalletToId) {
      await tx.wallet.update({
        where: { id: oldWalletToId },
        data: { balance: { decrement: oldAmount } },
      })
    } else if (oldType === 'TRANSFER') {
      if (oldWalletFromId) {
        await tx.wallet.update({
          where: { id: oldWalletFromId },
          data: { balance: { increment: oldAmount } },
        })
      }
      if (oldWalletToId) {
        await tx.wallet.update({
          where: { id: oldWalletToId },
          data: { balance: { decrement: oldAmount } },
        })
      }
    }

    // ── Step 2: Update the transaction ────────────────────────
    const updated = await tx.transaction.update({
      where: { id },
      data: {
        amount: newAmount,
        type: newType,
        categoryId: newCategoryId,
        walletFromId: newType === 'INCOME' ? null : newWalletFromId,
        walletToId: newType === 'EXPENSE' ? null : newWalletToId,
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
        ...(body.date && { date: new Date(body.date) }),
        // Detail fields
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.unitPrice !== undefined && { unitPrice: body.unitPrice }),
        // Promo fields
        ...(body.isPromo !== undefined && { isPromo: body.isPromo }),
        ...(body.promoType !== undefined && { promoType: body.promoType }),
        ...(body.promoValue !== undefined && { promoValue: body.promoValue }),
        ...(body.promoDetails !== undefined && { promoDetails: body.promoDetails?.trim() || null }),
      },
      include: { category: true, walletFrom: true, walletTo: true },
    })

    // ── Step 3: Apply new transaction's effect ────────────────
    if (newType === 'EXPENSE' && newWalletFromId) {
      await tx.wallet.update({
        where: { id: newWalletFromId },
        data: { balance: { decrement: newAmount } },
      })
    } else if (newType === 'INCOME' && newWalletToId) {
      await tx.wallet.update({
        where: { id: newWalletToId },
        data: { balance: { increment: newAmount } },
      })
    } else if (newType === 'TRANSFER') {
      if (newWalletFromId) {
        await tx.wallet.update({
          where: { id: newWalletFromId },
          data: { balance: { decrement: newAmount } },
        })
      }
      if (newWalletToId) {
        await tx.wallet.update({
          where: { id: newWalletToId },
          data: { balance: { increment: newAmount } },
        })
      }
    }

    return updated
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

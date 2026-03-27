// server/api/transactions/[id].put.ts
// Update a transaction + atomic wallet balance reversal & re-application

import { z } from 'zod'
import { PromoType } from '@prisma/client'
import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { adjustWalletBalance } from '~/server/utils/wallet'
import { getExchangeRate } from '~/server/utils/exchange'

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
  const existing = await prisma.transaction.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Transaksi tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => transactionUpdateSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  const newAmount = body.amount ?? Number(existing.amount)
  const newType = body.type ?? existing.type
  const newCategoryId = body.categoryId ?? existing.categoryId
  const newWalletFromId = body.walletFromId !== undefined ? body.walletFromId : existing.walletFromId
  const newWalletToId = body.walletToId !== undefined ? body.walletToId : existing.walletToId
  const newQuantity = body.quantity ?? existing.quantity ?? 1
  const newUnitPrice = body.unitPrice ?? (existing.unitPrice !== null ? Number(existing.unitPrice) : undefined)
  const newIsPromo = body.isPromo ?? existing.isPromo

  // ── Relaxed Validation ──────────────────────────────────────
  if (newQuantity !== undefined && newUnitPrice !== undefined && !newIsPromo) {
    const expected = newQuantity * newUnitPrice
    const diff = Math.abs(newAmount - expected)
    if (diff > expected * 0.01) {
       console.warn(`[Update Warning] Amount ${newAmount} differs from Qty*Price ${expected}`)
    }
  }

  // Wallet validation
  if (newType === 'EXPENSE' && !newWalletFromId) throw createError({ statusCode: 400, message: 'Pilih dompet sumber' })
  if (newType === 'INCOME' && !newWalletToId) throw createError({ statusCode: 400, message: 'Pilih dompet tujuan' })
  if (newType === 'TRANSFER' && (!newWalletFromId || !newWalletToId)) throw createError({ statusCode: 400, message: 'Pilih asal dan tujuan' })

  // Verify category
  const targetCategory = await prisma.category.findFirst({ where: { id: newCategoryId, userId: user.id } })
  if (!targetCategory) throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan' })

  // Exchange rate logic
  let targetAmount: number | null = null
  let exchangeRate: number | null = null
  const baseCurrency = user.currency

  const wFrom = newWalletFromId ? await prisma.wallet.findFirst({ where: { id: newWalletFromId, userId: user.id } }) : null
  const wTo = newWalletToId ? await prisma.wallet.findFirst({ where: { id: newWalletToId, userId: user.id } }) : null

  if (newType === 'TRANSFER' && wFrom && wTo) {
    exchangeRate = await getExchangeRate(wFrom.currency, wTo.currency)
    targetAmount = newAmount * exchangeRate
  } else {
    const walletCurrency = newType === 'INCOME' ? wTo?.currency : wFrom?.currency
    if (walletCurrency && walletCurrency !== baseCurrency) {
      exchangeRate = await getExchangeRate(walletCurrency, baseCurrency)
      targetAmount = newAmount * exchangeRate
    } else {
      targetAmount = newAmount
      exchangeRate = 1
    }
  }

  const oldAmount = Number(existing.amount)
  const oldTargetAmount = existing.targetAmount ? Number(existing.targetAmount) : oldAmount

  // ── Atomic Update ──
  const txResult = await prisma.$transaction(async (tx) => {
    // 1. REVERSE OLD
    if (existing.type === 'EXPENSE') {
      await updateBudgetSpent(tx, user.id, existing.categoryId, existing.date, -oldAmount)
    }
    if (existing.walletFromId) await adjustWalletBalance(tx, existing.walletFromId, oldAmount)
    if (existing.walletToId) {
      const amountToReverse = existing.type === 'TRANSFER' ? oldTargetAmount : oldAmount
      await adjustWalletBalance(tx, existing.walletToId, -amountToReverse)
    }

    // 2. UPDATE
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
        quantity: newQuantity,
        unitPrice: newUnitPrice,
        isPromo: newIsPromo,
        ...(body.promoType !== undefined && { promoType: body.promoType }),
        ...(body.promoValue !== undefined && { promoValue: body.promoValue }),
        ...(body.promoDetails !== undefined && { promoDetails: body.promoDetails?.trim() || null }),
        targetAmount,
        exchangeRate,
      },
      include: { category: true, walletFrom: true, walletTo: true },
    })

    // 3. APPLY NEW
    if (newType === 'EXPENSE') {
      await updateBudgetSpent(tx, user.id, updated.categoryId, updated.date, newAmount)
    }
    if (newWalletFromId && newType !== 'INCOME') {
      await adjustWalletBalance(tx, newWalletFromId, -newAmount)
    }
    if (newWalletToId && newType !== 'EXPENSE') {
      const amountToAdd = newType === 'TRANSFER' ? (targetAmount || newAmount) : newAmount
      await adjustWalletBalance(tx, newWalletToId, amountToAdd)
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


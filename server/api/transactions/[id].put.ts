// server/api/transactions/[id].put.ts
// Update a transaction + atomic wallet balance reversal & re-application

import { z } from 'zod'
import { PromoType } from '@prisma/client'
import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { recalculateWalletBalance } from '~/server/utils/wallet'

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
  
  const newQuantity = body.quantity ?? existing.quantity ?? 1
  const newUnitPrice = body.unitPrice ?? (existing.unitPrice !== null ? Number(existing.unitPrice) : undefined)
  const newIsPromo = body.isPromo ?? existing.isPromo

  // ── Validation: amount vs quantity * unitPrice ────────────────
  if (newQuantity !== undefined && newUnitPrice !== undefined && !newIsPromo) {
    if (newAmount !== newQuantity * newUnitPrice) {
      throw createError({ statusCode: 400, message: 'Total nominal harus sama dengan kuantitas dikali harga satuan' })
    }
  }

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
  const targetCategory = await prisma.category.findFirst({ 
    where: { id: newCategoryId, userId: user.id } 
  })
  if (!targetCategory) throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan' })

  // ── Validation: Category Type Match ─────────────────────────
  if (newType === 'INCOME' && targetCategory.type !== 'INCOME') {
    throw createError({ statusCode: 400, message: 'Transaksi pemasukan harus menggunakan kategori bertipe Pemasukan' })
  }
  if (newType === 'EXPENSE' && targetCategory.type !== 'EXPENSE') {
    throw createError({ statusCode: 400, message: 'Transaksi pengeluaran harus menggunakan kategori bertipe Pengeluaran' })
  }

  // ── Wallet and Balance Validation ───────────────────────────
  if (newWalletFromId) {
    const w = await prisma.wallet.findFirst({ where: { id: newWalletFromId, userId: user.id } })
    if (!w) throw createError({ statusCode: 404, message: 'Dompet sumber tidak ditemukan' })

    // Check balance for EXPENSE/TRANSFER during update
    if (newType === 'EXPENSE' || newType === 'TRANSFER') {
      // Logic for update: available balance = current + old (if reversed)
      // but simpler check: if it's the same wallet, we add the old amount back mentally
      let effectiveBalance = Number(w.balance)
      if (existing.walletFromId === newWalletFromId) {
        effectiveBalance += Number(existing.amount)
      }
      
      if (effectiveBalance < newAmount) {
        throw createError({ 
          statusCode: 400, 
          message: `Saldo tidak mencukupi untuk pembaruan ini. Saldo efektif: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(effectiveBalance)}` 
        })
      }
    }
  }

  const oldAmount = Number(existing.amount)
  const oldType = existing.type
  const oldWalletFromId = existing.walletFromId
  const oldWalletToId = existing.walletToId

  // Handle Multi-Currency Conversion
  let targetAmount: number | null = null
  let exchangeRate: number | null = null

  const baseCurrency = user.currency // User's primary currency

  const wFrom = newWalletFromId ? await prisma.wallet.findFirst({ where: { id: newWalletFromId, userId: user.id } }) : null
  const wTo = newWalletToId ? await prisma.wallet.findFirst({ where: { id: newWalletToId, userId: user.id } }) : null

  if (newType === 'TRANSFER' && wFrom && wTo) {
    if (wFrom.currency !== wTo.currency) {
      try {
        const rateRes = await $fetch<any>(`/api/exchange-rates?base=${wFrom.currency}&target=${wTo.currency}`)
        if (rateRes && rateRes.rate) {
          exchangeRate = rateRes.rate
          targetAmount = newAmount * (exchangeRate ?? 1)
        }
      } catch (e) {
        console.error('Failed to fetch exchange rate during update', e)
        exchangeRate = 1
        targetAmount = newAmount
      }
    } else {
      targetAmount = newAmount
      exchangeRate = 1
    }
  } else {
    // For INCOME and EXPENSE, store value in USER'S primary currency
    const walletCurrency = newType === 'INCOME' ? wTo?.currency : wFrom?.currency
    
    if (walletCurrency && walletCurrency !== baseCurrency) {
      try {
        const rateRes = await $fetch<any>(`/api/exchange-rates?base=${walletCurrency}&target=${baseCurrency}`)
        if (rateRes && rateRes.rate) {
          exchangeRate = rateRes.rate
          targetAmount = newAmount * (exchangeRate ?? 1)
        }
      } catch (e) {
        console.error('Failed to fetch exchange rate during update for reporting', e)
        exchangeRate = 1
        targetAmount = newAmount
      }
    } else {
      targetAmount = newAmount
      exchangeRate = 1
    }
  }

  // ── Atomic: update transaction → apply budget & new balances ──
  const txResult = await prisma.$transaction(async (tx) => {

    // ── Step 1: Reverse old budget spent (only for EXPENSE) ────────
    if (oldType === 'EXPENSE') {
      await updateBudgetSpent(tx, user.id, existing.categoryId, existing.date, -oldAmount)
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
        // Multi-currency fields (Reset or update)
        targetAmount,
        exchangeRate,
      },
      include: { category: true, walletFrom: true, walletTo: true },
    })

    // ── Step 3: Apply new budget spent (only for EXPENSE) ──────────
    if (newType === 'EXPENSE') {
      const finalDate = updated.date
      await updateBudgetSpent(tx, user.id, updated.categoryId, finalDate, newAmount)
    }

    // ── Step 4: Recalculate affected wallet balances ──────────────
    const walletsToRecalculate = new Set<string>()
    if (oldWalletFromId) walletsToRecalculate.add(oldWalletFromId)
    if (oldWalletToId) walletsToRecalculate.add(oldWalletToId)
    if (newWalletFromId) walletsToRecalculate.add(newWalletFromId)
    if (newWalletToId) walletsToRecalculate.add(newWalletToId)

    for (const walletId of walletsToRecalculate) {
      await recalculateWalletBalance(tx, walletId)
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

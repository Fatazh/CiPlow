// server/api/transactions/index.post.ts
// Create a new transaction + auto-update wallet balance

import { z } from 'zod'
import { PromoType } from '@prisma/client'
import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { recalculateWalletBalance } from '~/server/utils/wallet'

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

  // ── Validation: amount vs quantity * unitPrice ────────────────
  if (body.quantity !== undefined && body.unitPrice !== undefined && !body.isPromo) {
    if (amount !== body.quantity * body.unitPrice) {
      throw createError({ statusCode: 400, message: 'Total nominal harus sama dengan kuantitas dikali harga satuan' })
    }
  }

  let wFrom = null
  let wTo = null

  if (body.walletFromId) {
    wFrom = await prisma.wallet.findFirst({ where: { id: body.walletFromId, userId: user.id } })
    if (!wFrom) throw createError({ statusCode: 404, message: 'Dompet sumber tidak ditemukan' })
    
    // Check for sufficient balance (for EXPENSE and TRANSFER)
    if ((body.type === 'EXPENSE' || body.type === 'TRANSFER') && Number(wFrom.balance) < amount) {
      throw createError({ 
        statusCode: 400, 
        message: `Saldo tidak mencukupi. Saldo saat ini: ${Number(wFrom.balance)}` 
      })
    }
  }
  if (body.walletToId) {
    wTo = await prisma.wallet.findFirst({ where: { id: body.walletToId, userId: user.id } })
    if (!wTo) throw createError({ statusCode: 404, message: 'Dompet tujuan tidak ditemukan' })
  }

  // Handle Multi-Currency Conversion
  let targetAmount: number | null = null
  let exchangeRate: number | null = null

  const baseCurrency = user.currency // User's primary currency

  if (body.type === 'TRANSFER' && wFrom && wTo) {
    // For transfers, targetAmount is the value in the DESTINATION wallet's currency
    if (wFrom.currency !== wTo.currency) {
      try {
        const rateRes = await $fetch<any>(`/api/exchange-rates?base=${wFrom.currency}&target=${wTo.currency}`)
        if (rateRes && rateRes.rate) {
          exchangeRate = rateRes.rate
          targetAmount = amount * (exchangeRate ?? 1)
        }
      } catch (e) {
        console.error('Failed to fetch exchange rate for transfer', e)
        exchangeRate = 1
        targetAmount = amount
      }
    } else {
      targetAmount = amount
      exchangeRate = 1
    }
  } else {
    // For INCOME and EXPENSE, we want to store the value in the USER'S primary currency
    // for consistent reporting in the dashboard and analytics.
    const walletCurrency = body.type === 'INCOME' ? wTo?.currency : wFrom?.currency
    
    if (walletCurrency && walletCurrency !== baseCurrency) {
      try {
        const rateRes = await $fetch<any>(`/api/exchange-rates?base=${walletCurrency}&target=${baseCurrency}`)
        if (rateRes && rateRes.rate) {
          exchangeRate = rateRes.rate
          targetAmount = amount * (exchangeRate ?? 1)
        }
      } catch (e) {
        console.error('Failed to fetch exchange rate for reporting', e)
        exchangeRate = 1
        targetAmount = amount
      }
    } else {
      // Wallet is in the same currency as user base
      targetAmount = amount
      exchangeRate = 1
    }
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
        // Multi-currency fields
        targetAmount,
        exchangeRate,
      },
      include: {
        category: true,
        walletFrom: true,
        walletTo: true,
      },
    })

    // Update wallet balances and budget
    if (body.type === 'EXPENSE') {
      await updateBudgetSpent(tx, user.id, body.categoryId, txDate, amount)
    }

    if (body.walletFromId) {
      await recalculateWalletBalance(tx, body.walletFromId)
    }
    if (body.walletToId) {
      await recalculateWalletBalance(tx, body.walletToId)
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

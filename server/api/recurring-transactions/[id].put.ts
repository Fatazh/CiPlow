// server/api/recurring-transactions/[id].put.ts
// Update recurring transaction rule

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

const updateRecurringSchema = z.object({
  amount: z.number().positive('Nominal harus lebih dari 0'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], { message: 'Tipe transaksi tidak valid' }),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  interval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string().optional(),
  nextDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  walletFromId: z.string().optional().nullable(),
  walletToId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID transaksi berulang diperlukan' })

  const existing = await prisma.recurringTransaction.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Jadwal transaksi berulang tidak ditemukan' })
  }

  const result = await readValidatedBody(event, (body) => updateRecurringSchema.safeParse(body))
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

  if (body.type === 'INCOME' && category.type !== 'INCOME') {
    throw createError({ statusCode: 400, message: 'Transaksi pemasukan harus menggunakan kategori bertipe Pemasukan' })
  }
  if (body.type === 'EXPENSE' && category.type !== 'EXPENSE') {
    throw createError({ statusCode: 400, message: 'Transaksi pengeluaran harus menggunakan kategori bertipe Pengeluaran' })
  }

  const updated = await prisma.recurringTransaction.update({
    where: { id },
    data: {
      amount: body.amount,
      type: body.type,
      description: body.description?.trim() || null,
      notes: body.notes?.trim() || null,
      interval: body.interval,
      startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
      nextDate: body.nextDate ? new Date(body.nextDate) : existing.nextDate,
      endDate: body.endDate ? new Date(body.endDate) : null,
      categoryId: body.categoryId,
      walletFromId: body.walletFromId || null,
      walletToId: body.walletToId || null,
      isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
    },
  })

  return { ok: true, message: 'Jadwal transaksi berulang berhasil diperbarui', data: updated }
})

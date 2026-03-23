import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const recurringSchema = z.object({
  amount: z.number().positive('Nominal harus lebih dari 0'),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER'], { message: 'Tipe transaksi tidak valid' }),
  description: z.string().optional(),
  notes: z.string().optional(),
  interval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string(), // ISO string
  endDate: z.string().optional(),
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  walletFromId: z.string().optional(),
  walletToId: z.string().optional(),
  quantity: z.number().optional(),
  unitPrice: z.number().optional(),
  isPromo: z.boolean().optional(),
  promoType: z.enum(['PERCENTAGE', 'FIXED', 'BUY_X_GET_Y']).optional(),
  promoValue: z.number().optional(),
  promoDetails: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const result = await readValidatedBody(event, (body) => recurringSchema.safeParse(body))
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

  const startDate = new Date(body.startDate)
  const endDate = body.endDate ? new Date(body.endDate) : null

  const recurringTransaction = await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      amount: body.amount,
      type: body.type,
      description: body.description?.trim() || null,
      notes: body.notes?.trim() || null,
      interval: body.interval,
      startDate,
      nextDate: startDate,
      endDate,
      categoryId: body.categoryId,
      walletFromId: body.walletFromId || null,
      walletToId: body.walletToId || null,
      quantity: body.quantity || 1,
      unitPrice: body.unitPrice || null,
      isPromo: body.isPromo || false,
      promoType: body.promoType as any || null,
      promoValue: body.promoValue || null,
      promoDetails: body.promoDetails?.trim() || null,
    },
  })

  return { ok: true, data: recurringTransaction }
})

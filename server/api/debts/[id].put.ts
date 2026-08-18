// server/api/debts/[id].put.ts
// Update debt record details

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

const updateDebtSchema = z.object({
  personName: z.string().min(1).max(50).optional(),
  totalAmount: z.number().positive().optional(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)

  const existing = await prisma.debt.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Catatan hutang/piutang tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => updateDebtSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }

  const data = result.data
  const total = data.totalAmount ?? Number(existing.totalAmount)
  const paid = Number(existing.paidAmount)
  const status = paid >= total ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID')

  const updated = await prisma.debt.update({
    where: { id },
    data: {
      ...(data.personName && { personName: data.personName.trim() }),
      ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
      status,
    },
  })

  return {
    ok: true,
    message: 'Catatan berhasil diperbarui!',
    data: {
      id: updated.id,
      personName: updated.personName,
      totalAmount: Number(updated.totalAmount),
      paidAmount: Number(updated.paidAmount),
      status: updated.status,
    },
  }
})

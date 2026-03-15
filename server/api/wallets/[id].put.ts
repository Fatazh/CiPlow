// server/api/wallets/[id].put.ts
// Update a wallet

import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const walletUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Nama wallet minimal 2 karakter').optional(),
  type: z.enum(['CASH', 'BANK', 'E_WALLET', 'INVESTMENT', 'OTHER'], { message: 'Tipe wallet tidak valid' }).optional(),
  balance: z.number().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
// Verify ownership
  const existing = await prisma.wallet.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Wallet tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => walletUpdateSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  // If setting as default, unset other defaults first
  if (body.isDefault === true) {
    await prisma.wallet.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    })
  }

  const wallet = await prisma.wallet.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name.trim() }),
      ...(body.type && { type: body.type as any }),
      ...(body.balance !== undefined && { balance: body.balance }),
      ...(body.color && { color: body.color }),
      ...(body.icon && { icon: body.icon }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
    },
  })

  return {
    ok: true,
    data: {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balance: Number(wallet.balance),
      color: wallet.color,
      icon: wallet.icon,
      isDefault: wallet.isDefault,
      description: wallet.description,
    },
  }
})

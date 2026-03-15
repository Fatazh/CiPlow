// server/api/wallets/index.post.ts
// Create a new wallet

import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const walletSchema = z.object({
  name: z.string().trim().min(2, 'Nama wallet minimal 2 karakter'),
  type: z.enum(['CASH', 'BANK', 'E_WALLET', 'INVESTMENT', 'OTHER'], { message: 'Tipe wallet tidak valid' }),
  balance: z.number().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isDefault: z.boolean().optional(),
  description: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const result = await readValidatedBody(event, (body) => walletSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  const wallet = await prisma.$transaction(async (tx) => {
    // If setting as default, remove default status from all other wallets of this user
    if (body.isDefault) {
      await tx.wallet.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    return await tx.wallet.create({
      data: {
        name: body.name.trim(),
        type: body.type as any,
        balance: body.balance ?? 0,
        color: body.color ?? '#10b981',
        icon: body.icon ?? 'wallet',
        isDefault: body.isDefault || false,
        description: body.description?.trim() || null,
        userId: user.id,
      },
    })
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

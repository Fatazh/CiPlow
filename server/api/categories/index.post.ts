// server/api/categories/index.post.ts
// Create a new category

import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Nama kategori minimal 2 karakter'),
  type: z.enum(['INCOME', 'EXPENSE'], { message: 'Tipe kategori tidak valid' }),
  color: z.string().optional(),
  icon: z.string().optional(),
  isDefault: z.boolean().optional(),
  description: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const result = await readValidatedBody(event, (body) => categorySchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  const category = await prisma.$transaction(async (tx) => {
  // If setting as default, remove default status from all other categories of SAME TYPE
  if (body.isDefault) {
    await tx.category.updateMany({
      where: { userId: user.id, type: body.type, isDefault: true },
      data: { isDefault: false },
    })
  }

  return await tx.category.create({
    data: {
      name: body.name.trim(),
      type: body.type,
      color: body.color ?? '#10b981',
      icon: body.icon ?? 'tag',
      isDefault: body.isDefault || false,
      description: body.description?.trim() || null,
      userId: user.id,
    },
  })
})

  return {
    ok: true,
    data: {
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      description: category.description,
      isDefault: category.isDefault,
    },
  }
})

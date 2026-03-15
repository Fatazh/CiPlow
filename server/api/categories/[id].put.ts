// server/api/categories/[id].put.ts
// Update a category

import { z } from 'zod'
import prisma from '~/server/utils/prisma'

const categoryUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Nama kategori minimal 2 karakter').optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  isDefault: z.boolean().optional(),
  description: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID diperlukan' })

  const user = await requireAuth(event)
const existing = await prisma.category.findFirst({
    where: { id, userId: user.id },
  })
  if (!existing) throw createError({ statusCode: 404, message: 'Kategori tidak ditemukan' })

  const result = await readValidatedBody(event, (body) => categoryUpdateSchema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  const body = result.data

  const category = await prisma.$transaction(async (tx) => {
    // If setting as default, remove default status from all other categories of SAME TYPE
    if (body.isDefault === true) {
      await tx.category.updateMany({
        where: { userId: user.id, type: existing.type, isDefault: true },
        data: { isDefault: false },
      })
    }

    return await tx.category.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.color && { color: body.color }),
        ...(body.icon && { icon: body.icon }),
        ...(body.description !== undefined && { description: body.description?.trim() || null }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
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

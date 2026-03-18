// server/api/auth/password.put.ts
// Change user password

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { verifyPassword, hashPassword } from '~/server/utils/auth'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini diperlukan'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const result = await readValidatedBody(event, (body) => passwordSchema.safeParse(body))
  if (!result.success) {
    throw createError({ 
      statusCode: 400, 
      message: result.error.issues[0]?.message || 'Input tidak valid' 
    })
  }
  
  const { currentPassword, newPassword } = result.data

  // Get full user with password hash
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  })

  if (!dbUser || !dbUser.password) {
    throw createError({ statusCode: 404, message: 'User tidak ditemukan' })
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, dbUser.password)
  if (!isValid) {
    throw createError({ statusCode: 400, message: 'Password saat ini salah' })
  }

  // Hash and save new password
  const newHashedPassword = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: user.id },
    data: { password: newHashedPassword },
  })

  return { ok: true, message: 'Password berhasil diperbarui' }
})

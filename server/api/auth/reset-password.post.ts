// server/api/auth/reset-password.post.ts
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '~/server/utils/prisma'
import { hashPassword, revokeUserSessions } from '~/server/utils/auth'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token wajib ada'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, (body) => resetPasswordSchema.safeParse(body))
  
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Input tidak valid' })
  }
  
  const { token, password } = result.data

  // 1. Hash the token from URL to compare with DB
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  // 2. Find user with valid token and not expired
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() }
    }
  })

  if (!user) {
    throw createError({ statusCode: 400, message: 'Token tidak valid atau sudah kedaluwarsa' })
  }

  // 3. Update password
  const hashedPassword = await hashPassword(password)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    }
  })

  await revokeUserSessions(user.id)

  return { ok: true, message: 'Password berhasil diperbarui. Silakan login kembali.' }
})

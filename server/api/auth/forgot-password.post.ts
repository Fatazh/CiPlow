// server/api/auth/forgot-password.post.ts
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '~/server/utils/prisma'
import { assertRateLimit } from '~/server/utils/rate-limit'

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
})

export default defineEventHandler(async (event) => {
  assertRateLimit(event, {
    key: 'auth-forgot-password',
    max: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Terlalu banyak permintaan reset password. Coba lagi nanti.',
  })

  const result = await readValidatedBody(event, (body) => forgotPasswordSchema.safeParse(body))
  
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Email wajib diisi' })
  }
  
  const { email } = result.data

  // 1. Find user
  const user = await prisma.user.findUnique({ where: { email } })
  
  // For security, don't reveal if user exists or not
  if (!user) {
    return { ok: true, message: 'Jika email terdaftar, instruksi reset akan dikirim.' }
  }

  // 2. Generate token
  const token = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 3600000) // 1 hour

  // 3. Save to DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: expires
    }
  })

  // 4. Send email (Simulasi)
  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`
  
  console.log('--- RESET PASSWORD EMAIL (SIMULASI) ---')
  console.log(`To: ${email}`)
  console.log(`Link: ${resetUrl}`)
  console.log('----------------------------------------')

  return { 
    ok: true, 
    message: 'Jika email terdaftar, instruksi reset akan dikirim.',
  }
})

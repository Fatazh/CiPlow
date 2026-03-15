// server/api/auth/login.post.ts
// Login with email/password

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { verifyPassword, createSession } from '~/server/utils/auth'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi')
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, (body) => loginSchema.safeParse(body))
  
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0]?.message || 'Email dan password wajib diisi' })
  }
  
  const body = result.data

  // ── Find user ──────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: body.email.trim().toLowerCase() },
  })

  if (!user || !user.password) {
    throw createError({ statusCode: 401, message: 'Email atau password salah' })
  }

  // ── Verify password ────────────────────────────────────────
  const valid = await verifyPassword(body.password, user.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Email atau password salah' })
  }

  // ── Create session ─────────────────────────────────────────
  await createSession(user.id, event)

  return {
    ok: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  }
})

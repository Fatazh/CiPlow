// server/api/auth/register.post.ts
// Register new user with email/password

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { hashPassword, createSession } from '~/server/utils/auth'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter')
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, (body) => registerSchema.safeParse(body))
  
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message || 'Input tidak valid',
    })
  }

  const body = result.data

  // ── Check existing ─────────────────────────────────────────
  const existing = await prisma.user.findUnique({
    where: { email: body.email.trim().toLowerCase() },
  })
  if (existing) {
    throw createError({ statusCode: 409, message: 'Email sudah terdaftar' })
  }

  // ── Create user ────────────────────────────────────────────
  const hashedPassword = await hashPassword(body.password)

  const user = await prisma.user.create({
    data: {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      password: hashedPassword,
    },
  })

  // ── Create default categories & wallet for new user ────────
  const defaultExpenseCategories = [
    { name: 'Makanan & Minuman', icon: '🍔', color: '#f59e0b', type: 'EXPENSE' as const },
    { name: 'Transportasi', icon: '🚗', color: '#ef4444', type: 'EXPENSE' as const },
    { name: 'Belanja', icon: '🛍️', color: '#ec4899', type: 'EXPENSE' as const },
    { name: 'Hiburan', icon: '🎮', color: '#8b5cf6', type: 'EXPENSE' as const },
    { name: 'Tagihan', icon: '📄', color: '#6366f1', type: 'EXPENSE' as const },
    { name: 'Kesehatan', icon: '💊', color: '#14b8a6', type: 'EXPENSE' as const },
    { name: 'Pendidikan', icon: '📚', color: '#0ea5e9', type: 'EXPENSE' as const },
    { name: 'Lainnya', icon: '📦', color: '#64748b', type: 'EXPENSE' as const },
  ]

  const defaultIncomeCategories = [
    { name: 'Gaji', icon: '💰', color: '#10b981', type: 'INCOME' as const },
    { name: 'Freelance', icon: '💻', color: '#06b6d4', type: 'INCOME' as const },
    { name: 'Investasi', icon: '📈', color: '#f59e0b', type: 'INCOME' as const },
    { name: 'Hadiah', icon: '🎁', color: '#ec4899', type: 'INCOME' as const },
    { name: 'Lainnya', icon: '💵', color: '#64748b', type: 'INCOME' as const },
  ]

  await prisma.category.createMany({
    data: [...defaultExpenseCategories, ...defaultIncomeCategories].map((c) => ({
      ...c,
      userId: user.id,
      isDefault: true,
    })),
  })

  await prisma.wallet.create({
    data: {
      name: 'Kas Tunai',
      type: 'CASH',
      balance: 0,
      color: '#10b981',
      icon: '💵',
      isDefault: true,
      userId: user.id,
    },
  })

  // ── Create session ─────────────────────────────────────────
  await createSession(user.id, event)

  return {
    ok: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  }
})

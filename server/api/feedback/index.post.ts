// server/api/feedback/index.post.ts
// Handle user feedback, app rating, and bug reports

import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { getUserFromSession } from '~/server/utils/auth'

const feedbackSchema = z.object({
  type: z.enum(['RATING', 'BUG_REPORT', 'FEEDBACK']),
  rating: z.number().min(1).max(5).optional().nullable(),
  category: z.string().optional().nullable(),
  message: z.string().min(1, 'Pesan / deskripsi tidak boleh kosong'),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  const result = await readValidatedBody(event, (body) => feedbackSchema.safeParse(body))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message || 'Input tidak valid',
    })
  }

  const { type, rating, category, message, metadata } = result.data

  const feedback = await prisma.feedback.create({
    data: {
      type,
      rating: rating || null,
      category: category || null,
      message: message.trim(),
      metadata: metadata || undefined,
      userId: user?.id || null,
    },
  })

  const successMessage = type === 'RATING'
    ? 'Terima kasih atas penilaian dan ulasan Anda! ⭐'
    : type === 'BUG_REPORT'
      ? 'Terima kasih telah melaporkan bug. Tim kami akan segera menindaklanjutinya! 🛠️'
      : 'Umpan balik Anda telah berhasil dikirim! 💬'

  return {
    ok: true,
    message: successMessage,
    data: { id: feedback.id },
  }
})

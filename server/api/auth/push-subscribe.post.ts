// server/api/auth/push-subscribe.post.ts
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)

  if (!body || !body.endpoint) {
    throw createError({ statusCode: 400, message: 'Invalid subscription data' })
  }

  // Push subscription has: endpoint, keys: { p256dh, auth }
  const { endpoint, keys } = body

  // Use upsert to prevent duplicates for same endpoint
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId: user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userId: user.id,
    },
  })

  return { ok: true, message: 'Langganan notifikasi berhasil disimpan' }
})

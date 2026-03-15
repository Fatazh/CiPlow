// server/api/auth/me.get.ts
// Get current authenticated user

import { getUserFromSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getUserFromSession(event)

  if (!user) {
    throw createError({ statusCode: 401, message: 'Belum login' })
  }

  return {
    ok: true,
    data: user,
  }
})

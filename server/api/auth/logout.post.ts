// server/api/auth/logout.post.ts
// Destroy session

import { deleteSession } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await deleteSession(event)
  return { ok: true }
})

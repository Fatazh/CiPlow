import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
// @ts-expect-error: Mismatch between @types/pg and adapter's expected types
const adapter = new PrismaPg(pool)

/**
 * PrismaClient singleton — prevents multiple instances during hot-reload in development.
 * In production a single instance is created and reused across all requests.
 */
const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}

export default prisma

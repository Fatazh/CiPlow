// server/plugins/errorHandler.ts
import { Prisma } from '@prisma/client'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    if (!event) return
    // If it's a Prisma error, format it to hide database details
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[Prisma Error]', error.code, error.message)
      
      // Common Prisma error codes
      if (error.code === 'P2002') {
        // Unique constraint failed
        const targets = error.meta?.target as string[]
        const field = targets?.[0] || 'Field'
        event.node.res.statusCode = 400
        event.node.res.end(JSON.stringify({
          statusCode: 400,
          message: `${field} sudah digunakan, silakan gunakan yang lain.`
        }))
        return
      }

      // Record not found
      if (error.code === 'P2025') {
        event.node.res.statusCode = 404
        event.node.res.end(JSON.stringify({
          statusCode: 404,
          message: 'Data tidak ditemukan.'
        }))
        return
      }
      
      // Default Prisma formatting
      event.node.res.statusCode = 400
      event.node.res.end(JSON.stringify({
        statusCode: 400,
        message: 'Terjadi kesalahan pada input data.'
      }))
      return
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error('[Prisma Validation Error]', error.message)
      event.node.res.statusCode = 400
      event.node.res.end(JSON.stringify({
        statusCode: 400,
        message: 'Format data tidak valid.'
      }))
      return
    }

    // Default Error Handling
    console.error('[Unhandled Error]', error)
  })
})

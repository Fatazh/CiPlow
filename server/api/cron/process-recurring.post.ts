import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { adjustWalletBalance } from '~/server/utils/wallet'
import { getExchangeRate } from '~/server/utils/exchange'
import { timingSafeEqual } from 'crypto'

function isValidCronSecret(expected: string, provided?: string) {
  if (!provided) {
    return false
  }

  const expectedBuffer = Buffer.from(expected)
  const providedBuffer = Buffer.from(provided)

  if (expectedBuffer.length !== providedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, providedBuffer)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const expectedSecret = config.cronSecret
  const authorization = getHeader(event, 'authorization')
  const providedSecret = getHeader(event, 'x-cron-secret')
    ?? (authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined)

  if (!expectedSecret) {
    throw createError({
      statusCode: 500,
      message: 'Cron secret belum dikonfigurasi',
    })
  }

  if (!isValidCronSecret(expectedSecret, providedSecret)) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const now = new Date()

  // Find all active recurring transactions where nextDate is in the past or today
  const dueTransactions = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextDate: { lte: now },
    },
    include: {
      walletFrom: true,
      walletTo: true
    }
  })

  let totalProcessed = 0

  for (const rt of dueTransactions) {
    const processedCount = await prisma.$transaction(async (tx) => {
      const lockedRows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id
        FROM recurring_transactions
        WHERE id = ${rt.id}
          AND "isActive" = true
          AND "nextDate" <= ${now}
        FOR UPDATE SKIP LOCKED
      `

      if (lockedRows.length === 0) {
        return 0
      }

      const recurring = await tx.recurringTransaction.findUnique({
        where: { id: rt.id },
        include: {
          walletFrom: true,
          walletTo: true
        }
      })

      if (!recurring || !recurring.isActive || recurring.nextDate > now) {
        return 0
      }

      let currentProcessDate = new Date(recurring.nextDate)
      let occurrencesCount = 0
      
      // Catch-up loop: process all missed occurrences up to 'now'
      while (currentProcessDate <= now) {
        // Stop if we hit the end date
        if (recurring.endDate && currentProcessDate > recurring.endDate) {
          break
        }

        // Multi-currency calculation using utility
        let targetAmount: number | null = null
        let exchangeRate: number | null = null

        if (recurring.type === 'TRANSFER' && recurring.walletFrom && recurring.walletTo) {
          if (recurring.walletFrom.currency !== recurring.walletTo.currency) {
            exchangeRate = await getExchangeRate(recurring.walletFrom.currency, recurring.walletTo.currency)
            targetAmount = Number(recurring.amount) * exchangeRate
          } else {
            targetAmount = Number(recurring.amount)
            exchangeRate = 1
          }
        } else {
          // For Income/Expense, store target in User's base currency (not easily available here without fetching User)
          // For now, assume base currency matches wallet or keep it 1:1 if unknown
          targetAmount = Number(recurring.amount)
          exchangeRate = 1
        }

        const amountNum = Number(recurring.amount)

        // 1. Create the actual transaction
        await tx.transaction.create({
          data: {
            amount: recurring.amount,
            type: recurring.type,
            description: recurring.description || 'Transaksi Rutin',
            notes: recurring.notes,
            date: new Date(currentProcessDate),
            userId: recurring.userId,
            categoryId: recurring.categoryId,
            walletFromId: recurring.walletFromId,
            walletToId: recurring.walletToId,
            quantity: recurring.quantity,
            unitPrice: recurring.unitPrice,
            isPromo: recurring.isPromo,
            promoType: recurring.promoType,
            promoValue: recurring.promoValue,
            promoDetails: recurring.promoDetails,
            targetAmount,
            exchangeRate
          },
        })

        // 2. Update wallet balances incrementally for each occurrence
        if (recurring.walletFromId) {
          await adjustWalletBalance(tx, recurring.walletFromId, -amountNum)
        }
        if (recurring.walletToId) {
          const amountToAdd = recurring.type === 'TRANSFER' ? (targetAmount || amountNum) : amountNum
          await adjustWalletBalance(tx, recurring.walletToId, amountToAdd)
        }

        // 3. Update budget
        if (recurring.type === 'EXPENSE') {
          await updateBudgetSpent(tx, recurring.userId, recurring.categoryId, new Date(currentProcessDate), amountNum)
        }

        // 4. Advance the date for next occurrence
        if (recurring.interval === 'DAILY') {
          currentProcessDate.setDate(currentProcessDate.getDate() + 1)
        } else if (recurring.interval === 'WEEKLY') {
          currentProcessDate.setDate(currentProcessDate.getDate() + 7)
        } else if (recurring.interval === 'MONTHLY') {
          currentProcessDate.setMonth(currentProcessDate.getMonth() + 1)
        } else if (recurring.interval === 'YEARLY') {
          currentProcessDate.setFullYear(currentProcessDate.getFullYear() + 1)
        }
        
        occurrencesCount++
      }

      // Check if endDate is passed to deactivate
      let isActive = true
      if (recurring.endDate && currentProcessDate > recurring.endDate) {
        isActive = false
      }

      // Update RecurringTransaction pointer and status
      await tx.recurringTransaction.update({
        where: { id: recurring.id },
        data: {
          nextDate: currentProcessDate,
          isActive,
        },
      })

      return occurrencesCount
    })

    totalProcessed += processedCount
  }

  return { ok: true, processedTransactions: totalProcessed }
})


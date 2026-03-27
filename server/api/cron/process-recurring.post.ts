import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { adjustWalletBalance } from '~/server/utils/wallet'
import { getExchangeRate } from '~/server/utils/exchange'

export default defineEventHandler(async (event) => {
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
    await prisma.$transaction(async (tx) => {
      let currentProcessDate = new Date(rt.nextDate)
      let occurrencesCount = 0
      
      // Catch-up loop: process all missed occurrences up to 'now'
      while (currentProcessDate <= now) {
        // Stop if we hit the end date
        if (rt.endDate && currentProcessDate > rt.endDate) {
          break
        }

        // Multi-currency calculation using utility
        let targetAmount: number | null = null
        let exchangeRate: number | null = null

        if (rt.type === 'TRANSFER' && rt.walletFrom && rt.walletTo) {
          if (rt.walletFrom.currency !== rt.walletTo.currency) {
            exchangeRate = await getExchangeRate(rt.walletFrom.currency, rt.walletTo.currency)
            targetAmount = Number(rt.amount) * exchangeRate
          } else {
            targetAmount = Number(rt.amount)
            exchangeRate = 1
          }
        } else {
          // For Income/Expense, store target in User's base currency (not easily available here without fetching User)
          // For now, assume base currency matches wallet or keep it 1:1 if unknown
          targetAmount = Number(rt.amount)
          exchangeRate = 1
        }

        const amountNum = Number(rt.amount)

        // 1. Create the actual transaction
        await tx.transaction.create({
          data: {
            amount: rt.amount,
            type: rt.type,
            description: rt.description || 'Transaksi Rutin',
            notes: rt.notes,
            date: new Date(currentProcessDate),
            userId: rt.userId,
            categoryId: rt.categoryId,
            walletFromId: rt.walletFromId,
            walletToId: rt.walletToId,
            quantity: rt.quantity,
            unitPrice: rt.unitPrice,
            isPromo: rt.isPromo,
            promoType: rt.promoType,
            promoValue: rt.promoValue,
            promoDetails: rt.promoDetails,
            targetAmount,
            exchangeRate
          },
        })

        // 2. Update wallet balances incrementally for each occurrence
        if (rt.walletFromId) {
          await adjustWalletBalance(tx, rt.walletFromId, -amountNum)
        }
        if (rt.walletToId) {
          const amountToAdd = rt.type === 'TRANSFER' ? (targetAmount || amountNum) : amountNum
          await adjustWalletBalance(tx, rt.walletToId, amountToAdd)
        }

        // 3. Update budget
        if (rt.type === 'EXPENSE') {
          await updateBudgetSpent(tx, rt.userId, rt.categoryId, new Date(currentProcessDate), amountNum)
        }

        // 4. Advance the date for next occurrence
        if (rt.interval === 'DAILY') {
          currentProcessDate.setDate(currentProcessDate.getDate() + 1)
        } else if (rt.interval === 'WEEKLY') {
          currentProcessDate.setDate(currentProcessDate.getDate() + 7)
        } else if (rt.interval === 'MONTHLY') {
          currentProcessDate.setMonth(currentProcessDate.getMonth() + 1)
        } else if (rt.interval === 'YEARLY') {
          currentProcessDate.setFullYear(currentProcessDate.getFullYear() + 1)
        }
        
        occurrencesCount++
        totalProcessed++
      }

      // Check if endDate is passed to deactivate
      let isActive = true
      if (rt.endDate && currentProcessDate > rt.endDate) {
        isActive = false
      }

      // Update RecurringTransaction pointer and status
      await tx.recurringTransaction.update({
        where: { id: rt.id },
        data: {
          nextDate: currentProcessDate,
          isActive,
        },
      })
    })
  }

  return { ok: true, processedTransactions: totalProcessed }
})


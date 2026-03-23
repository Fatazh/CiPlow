import prisma from '~/server/utils/prisma'
import { updateBudgetSpent } from '~/server/utils/budget'
import { recalculateWalletBalance } from '~/server/utils/wallet'

export default defineEventHandler(async (event) => {
  const now = new Date()

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

  let processedCount = 0

  for (const rt of dueTransactions) {
    await prisma.$transaction(async (tx) => {
      let currentProcessDate = new Date(rt.nextDate)
      
      // Catch-up loop: process all missed occurrences up to 'now'
      while (currentProcessDate <= now) {
        // Multi-currency calculation for the occurrence
        let targetAmount: number | null = null
        let exchangeRate: number | null = null

        if (rt.type === 'TRANSFER' && rt.walletFrom && rt.walletTo && rt.walletFrom.currency !== rt.walletTo.currency) {
          try {
            const rateRes = await $fetch<any>(`/api/exchange-rates?base=${rt.walletFrom.currency}&target=${rt.walletTo.currency}`)
            if (rateRes && rateRes.rate) {
              exchangeRate = rateRes.rate
              targetAmount = Number(rt.amount) * (exchangeRate ?? 1)
            }
          } catch (e) {
            console.error('Failed to fetch exchange rate for recurring transaction', e)
            exchangeRate = 1
            targetAmount = Number(rt.amount)
          }
        }

        // 1. Create the actual transaction
        await tx.transaction.create({
          data: {
            amount: rt.amount,
            type: rt.type,
            description: rt.description || 'Recurring Transaction',
            notes: rt.notes,
            date: new Date(currentProcessDate), // Make sure to use a copy of the date
            userId: rt.userId,
            categoryId: rt.categoryId,
            walletFromId: rt.walletFromId,
            walletToId: rt.walletToId,
            // Copied detail fields
            quantity: rt.quantity,
            unitPrice: rt.unitPrice,
            isPromo: rt.isPromo,
            promoType: rt.promoType,
            promoValue: rt.promoValue,
            promoDetails: rt.promoDetails,
            // Currency fields
            targetAmount,
            exchangeRate
          },
        })

        // Update budget directly for this specific occurrence
        if (rt.type === 'EXPENSE') {
          await updateBudgetSpent(tx, rt.userId, rt.categoryId, new Date(currentProcessDate), Number(rt.amount))
        }

        // 2. Calculate next date for the loop
        if (rt.interval === 'DAILY') {
          currentProcessDate.setDate(currentProcessDate.getDate() + 1)
        } else if (rt.interval === 'WEEKLY') {
          currentProcessDate.setDate(currentProcessDate.getDate() + 7)
        } else if (rt.interval === 'MONTHLY') {
          currentProcessDate.setMonth(currentProcessDate.getMonth() + 1)
        } else if (rt.interval === 'YEARLY') {
          currentProcessDate.setFullYear(currentProcessDate.getFullYear() + 1)
        }

        // Stop processing if we hit the end date
        if (rt.endDate && currentProcessDate > rt.endDate) {
          break
        }
        
        processedCount++
      }

      // 3. Update wallet and budgets (Recalculate ONCE after all catch-ups are created)
      if (rt.type === 'EXPENSE') {
        // Just triggering a recalculation for budget could be tricky for catch-up
        // We calculate budget inside the while loop for precision
      }

      if (rt.walletFromId) {
        await recalculateWalletBalance(tx, rt.walletFromId)
      }
      if (rt.walletToId) {
        await recalculateWalletBalance(tx, rt.walletToId)
      }

      // 4. Check if endDate is passed for final status
      let isActive = true
      if (rt.endDate && currentProcessDate > rt.endDate) {
        isActive = false
      }

      // 5. Update RecurringTransaction pointer
      await tx.recurringTransaction.update({
        where: { id: rt.id },
        data: {
          nextDate: currentProcessDate,
          isActive,
        },
      })
    })
  }

  return { ok: true, processedCount }
})

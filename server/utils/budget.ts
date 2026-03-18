// server/utils/budget.ts
// Utility to update budget 'spent' amount when transactions occur

import prisma from './prisma'

/**
 * Update the 'spent' amount for a budget when an EXPENSE transaction is added, updated, or removed.
 * @param userId - User ID
 * @param categoryId - Category ID (must be EXPENSE type)
 * @param date - Date of transaction to find the right budget month/year
 * @param amountChange - Amount to add to (positive) or subtract from (negative) the budget 'spent'
 */
export async function updateBudgetSpent(
  tx: any, // Prisma transaction client
  userId: string,
  categoryId: string,
  date: Date,
  amountChange: number
) {
  const month = date.getMonth() + 1 // 1-indexed
  const year = date.getFullYear()

  // Find the budget for this user, category, and month
  const budget = await tx.budget.findUnique({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId,
        month,
        year
      }
    }
  })

  // Only update if a budget exists for this category/month
  if (budget && budget.isActive) {
    await tx.budget.update({
      where: { id: budget.id },
      data: {
        spent: {
          increment: amountChange
        }
      }
    })
  }
}

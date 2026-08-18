// server/utils/budget.ts
// Utility to update budget 'spent' amount and calculate threshold alerts

export interface BudgetAlertInfo {
  triggered: boolean
  percentage: number
  budgetAmount: number
  newSpent: number
  categoryName: string
  level: 'warning' | 'danger' // warning (80-99%), danger (>=100%)
  message: string
}

/**
 * Update the 'spent' amount for a budget when an EXPENSE transaction is added, updated, or removed.
 * @param tx - Prisma transaction client
 * @param userId - User ID
 * @param categoryId - Category ID (must be EXPENSE type)
 * @param date - Date of transaction to find the right budget month/year
 * @param amountChange - Amount to add to (positive) or subtract from (negative) the budget 'spent'
 * @returns BudgetAlertInfo if budget threshold >= 80% is reached
 */
export async function updateBudgetSpent(
  tx: any,
  userId: string,
  categoryId: string,
  date: Date,
  amountChange: number
): Promise<BudgetAlertInfo | null> {
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
    },
    include: {
      category: true
    }
  })

  // Only update if a budget exists for this category/month
  if (budget && budget.isActive) {
    const newSpent = Math.max(0, Number(budget.spent) + amountChange)
    const budgetAmount = Number(budget.amount)

    await tx.budget.update({
      where: { id: budget.id },
      data: {
        spent: newSpent
      }
    })

    // Check alert threshold if amount was added
    if (amountChange > 0 && budgetAmount > 0) {
      const percentage = Math.round((newSpent / budgetAmount) * 100)
      const categoryName = budget.category?.name || 'Kategori'

      if (percentage >= 100) {
        return {
          triggered: true,
          percentage,
          budgetAmount,
          newSpent,
          categoryName,
          level: 'danger',
          message: `🚨 Peringatan: Pengeluaran untuk "${categoryName}" telah melebihi batas anggaran (${percentage}%)!`
        }
      } else if (percentage >= 80) {
        return {
          triggered: true,
          percentage,
          budgetAmount,
          newSpent,
          categoryName,
          level: 'warning',
          message: `⚠️ Perhatian: Pengeluaran untuk "${categoryName}" telah mencapai ${percentage}% dari batas anggaran bulanan.`
        }
      }
    }
  }

  return null
}

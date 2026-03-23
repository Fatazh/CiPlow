import type { Prisma } from '@prisma/client'

/**
 * Recalculates the exact balance of a wallet based on all its associated transactions.
 * This ensures wallet balance integrity and prevents drift.
 */
export const recalculateWalletBalance = async (
  tx: Omit<Prisma.TransactionClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  walletId: string
) => {
  // Sum all money entering the wallet (INCOME, TRANSFER to this wallet).
  // For multi-currency transfers, use targetAmount if available, otherwise amount.
  const incomeResult = await tx.$queryRaw<{ totalIn: number }[]>`
    SELECT COALESCE(SUM(COALESCE("targetAmount", "amount")), 0) as "totalIn"
    FROM "transactions"
    WHERE "walletToId" = ${walletId}
  `
  
  // Sum all money leaving the wallet (EXPENSE, TRANSFER from this wallet).
  // Always use amount for the source wallet.
  const expenseResult = await tx.$queryRaw<{ totalOut: number }[]>`
    SELECT COALESCE(SUM("amount"), 0) as "totalOut"
    FROM "transactions"
    WHERE "walletFromId" = ${walletId}
  `

  const totalIn = incomeResult[0]?.totalIn ? Number(incomeResult[0].totalIn) : 0
  const totalOut = expenseResult[0]?.totalOut ? Number(expenseResult[0].totalOut) : 0
  const newBalance = totalIn - totalOut

  await tx.wallet.update({
    where: { id: walletId },
    data: { balance: newBalance }
  })

  return newBalance
}

import type { Prisma } from '@prisma/client'

/**
 * Adjusts a wallet balance incrementally.
 * Much more performant for high transaction volume.
 * @param tx - Prisma transaction client
 * @param walletId - The wallet to adjust
 * @param amount - The amount to add (positive) or subtract (negative)
 */
export const adjustWalletBalance = async (
  tx: any,
  walletId: string,
  amount: number
) => {
  await tx.wallet.update({
    where: { id: walletId },
    data: {
      balance: {
        increment: amount
      }
    }
  })
}

/**
 * Recalculates the exact balance of a wallet based on all its associated transactions.
 * Use this sparingly (e.g. for maintenance or initial sync).
 */
export const recalculateWalletBalance = async (
  tx: any,
  walletId: string
) => {
  const incomeResult = await tx.$queryRaw<{ totalIn: number }[]>`
    SELECT COALESCE(SUM(COALESCE("targetAmount", "amount")), 0) as "totalIn"
    FROM "transactions"
    WHERE "walletToId" = ${walletId}
  `
  
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

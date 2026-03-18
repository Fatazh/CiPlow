// server/api/auth/reset-data.post.ts
// PERMANENTLY reset/delete all user data (transactions, budgets, wallets, categories)

import prisma from "~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  // We perform this in a transaction to ensure all or nothing is deleted
  await prisma.$transaction(async (tx) => {
    // 1. Delete all transactions
    await tx.transaction.deleteMany({
      where: { userId: user.id }
    });

    // 2. Delete all budgets
    await tx.budget.deleteMany({
      where: { userId: user.id }
    });

    // 3. Delete all wallets (Except default if needed, but here we reset everything)
    await tx.wallet.deleteMany({
      where: { userId: user.id }
    });

    // 4. Delete all categories (Except maybe system categories? 
    // Usually better to delete everything and let seed/init run again if they log in again,
    // but here we just wipe everything related to this user)
    await tx.category.deleteMany({
      where: { userId: user.id }
    });
  });

  return { ok: true, message: "Semua data berhasil dihapus permanen." };
});

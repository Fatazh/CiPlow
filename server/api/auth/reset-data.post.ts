// server/api/auth/reset-data.post.ts
// PERMANENTLY reset/delete all user data and re-initialize with defaults

import prisma from "~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  await prisma.$transaction(async (tx) => {
    // 1. Delete all transactions
    await tx.transaction.deleteMany({ where: { userId: user.id } });

    // 2. Delete all recurring transactions
    await tx.recurringTransaction.deleteMany({ where: { userId: user.id } });

    // 3. Delete all budgets
    await tx.budget.deleteMany({ where: { userId: user.id } });

    // 4. Delete all wallets
    await tx.wallet.deleteMany({ where: { userId: user.id } });

    // 5. Delete all categories
    await tx.category.deleteMany({ where: { userId: user.id } });

    // ── Re-seed defaults ─────────────────────────────────────
    const defaultExpenseCategories = [
      { name: 'Makanan & Minuman', icon: '🍔', color: '#f59e0b', type: 'EXPENSE' as const },
      { name: 'Transportasi', icon: '🚗', color: '#ef4444', type: 'EXPENSE' as const },
      { name: 'Belanja', icon: '🛍️', color: '#ec4899', type: 'EXPENSE' as const },
      { name: 'Hiburan', icon: '🎮', color: '#8b5cf6', type: 'EXPENSE' as const },
      { name: 'Tagihan', icon: '📄', color: '#6366f1', type: 'EXPENSE' as const },
      { name: 'Kesehatan', icon: '💊', color: '#14b8a6', type: 'EXPENSE' as const },
      { name: 'Pendidikan', icon: '📚', color: '#0ea5e9', type: 'EXPENSE' as const },
      { name: 'Lainnya', icon: '📦', color: '#64748b', type: 'EXPENSE' as const },
    ]

    const defaultIncomeCategories = [
      { name: 'Gaji', icon: '💰', color: '#10b981', type: 'INCOME' as const },
      { name: 'Freelance', icon: '💻', color: '#06b6d4', type: 'INCOME' as const },
      { name: 'Investasi', icon: '📈', color: '#f59e0b', type: 'INCOME' as const },
      { name: 'Hadiah', icon: '🎁', color: '#ec4899', type: 'INCOME' as const },
      { name: 'Lainnya', icon: '💵', color: '#64748b', type: 'INCOME' as const },
    ]

    await tx.category.createMany({
      data: [...defaultExpenseCategories, ...defaultIncomeCategories].map((c) => ({
        ...c,
        userId: user.id,
        isDefault: true,
      })),
    })

    await tx.wallet.create({
      data: {
        name: 'Kas Tunai',
        type: 'CASH',
        balance: 0,
        color: '#10b981',
        icon: '💵',
        isDefault: true,
        userId: user.id,
      },
    })
  });

  return { ok: true, message: "Semua data berhasil direset ke pengaturan awal." };
});
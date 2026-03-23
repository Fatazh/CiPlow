// server/api/dashboard/summary.get.ts
// Real dashboard summary — powered by Prisma + PostgreSQL

import prisma from "~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const year = now.getFullYear();

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const currentPeriod = `${monthNames[now.getMonth()]} ${year}`;

  // ── Get authenticated user ────────────────────────────────
  const user = await requireAuth(event)

  const uid = user.id;

  // ── Date ranges ───────────────────────────────────────────
  const curStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const curEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = new Date(prevYear, prevMonth - 1, 1, 0, 0, 0, 0);
  const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

  // ── Parallel queries ──────────────────────────────────────
  const [
    wallets,
    curTransactions,
    prevTransactions,
    budgets,
    recentTransactions,
  ] = await Promise.all([
    // All wallets (default first)
    prisma.wallet.findMany({
      where: { userId: uid },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),

    // Current month transactions (with relations)
    prisma.transaction.findMany({
      where: {
        userId: uid,
        date: { gte: curStart, lte: curEnd },
      },
      include: {
        category: true,
        walletFrom: true,
        walletTo: true,
      },
      orderBy: { date: "desc" },
    }),

    // Previous month transactions (only income/expense for comparison)
    prisma.transaction.findMany({
      where: {
        userId: uid,
        type: { in: ["INCOME", "EXPENSE"] },
        date: { gte: prevStart, lte: prevEnd },
      },
      select: { type: true, amount: true, targetAmount: true },
    }),

    // Active budgets for current month with category info
    prisma.budget.findMany({
      where: {
        userId: uid,
        month,
        year,
        isActive: true,
      },
      include: { category: true },
      orderBy: { amount: "desc" },
    }),

    // Last 5 transactions across all time
    prisma.transaction.findMany({
      where: { userId: uid },
      include: {
        category: true,
        walletFrom: true,
        walletTo: true,
      },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  // ── Balance ───────────────────────────────────────────────
  const baseCurrency = user.currency

  // For total balance, we must convert each wallet balance to user's base currency
  let totalBalanceInBase = 0
  for (const w of wallets) {
    if (w.currency === baseCurrency) {
      totalBalanceInBase += Number(w.balance)
    } else {
      try {
        // We fetch current rate from our own API
        const rateRes = await $fetch<any>(`/api/exchange-rates?base=${w.currency}&target=${baseCurrency}`)
        totalBalanceInBase += Number(w.balance) * (rateRes.rate ?? 1)
      } catch (e) {
        totalBalanceInBase += Number(w.balance)
      }
    }
  }

  const formattedWallets = wallets.map((w) => ({
    id: w.id,
    name: w.name,
    type: w.type,
    balance: Number(w.balance),
    currency: w.currency,
    color: w.color,
    icon: w.icon,
  }));

  // ── Monthly income / expense ──────────────────────────────
  // Use targetAmount (value in user's base currency) for reporting
  const curIncome = curTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.targetAmount ?? t.amount), 0);

  const curExpense = curTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.targetAmount ?? t.amount), 0);

  const prevIncome = prevTransactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.targetAmount ?? t.amount), 0);

  const prevExpense = prevTransactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.targetAmount ?? t.amount), 0);

  // Percentage change helpers
  const pctChange = (cur: number, prev: number): number => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 1000) / 10;
  };

  const incomeChange = pctChange(curIncome, prevIncome);
  const expenseChange = pctChange(curExpense, prevExpense);

  // Approximate last-month balance (total minus current net)
  const curNet = curIncome - curExpense;
  const lastMonthBal = Math.max(0, totalBalanceInBase - curNet);
  const balChange = pctChange(totalBalanceInBase, lastMonthBal);

  const savings = curIncome - curExpense;
  const savingsRate =
    curIncome > 0 ? Math.round((savings / curIncome) * 1000) / 10 : 0;

  // ── Category breakdown (expense) ─────────────────────────
  const categoryMap = new Map<
    string,
    {
      category: (typeof curTransactions)[0]["category"];
      amount: number;
    }
  >();

  for (const tx of curTransactions) {
    if (tx.type !== "EXPENSE") continue;
    const key = tx.categoryId;
    const existing = categoryMap.get(key);
    if (existing) {
      existing.amount += Number(tx.targetAmount ?? tx.amount);
    } else {
      categoryMap.set(key, {
        category: tx.category,
        amount: Number(tx.targetAmount ?? tx.amount),
      });
    }
  }

  const totalExp = curExpense || 1; // avoid division-by-zero

  const categories = Array.from(categoryMap.values())
    .sort((a, b) => b.amount - a.amount)
    .map(({ category, amount }) => ({
      id: category.id,
      name: category.name,
      amount,
      percentage: Math.round((amount / totalExp) * 1000) / 10,
      color: category.color,
      darkColor: category.color,
      icon: category.icon,
      type: "EXPENSE",
    }));

  // ── Budgets with live spent calculation ───────────────────
  const spentByCat = new Map<string, number>();
  for (const tx of curTransactions) {
    if (tx.type !== "EXPENSE") continue;
    spentByCat.set(
      tx.categoryId,
      (spentByCat.get(tx.categoryId) ?? 0) + Number(tx.targetAmount ?? tx.amount),
    );
  }

  const budgetData = budgets.map((b) => {
    const spent = spentByCat.get(b.categoryId) ?? 0;
    const budgeted = Number(b.amount);
    const remaining = budgeted - spent;
    const percentage =
      budgeted > 0 ? Math.round((spent / budgeted) * 1000) / 10 : 0;

    return {
      id: b.id,
      category: b.category.name,
      icon: b.category.icon,
      color: b.category.color,
      budgeted,
      spent,
      remaining,
      percentage,
    };
  });

  // ── Recent transactions (last 5) ──────────────────────────
  const formattedTransactions = recentTransactions.map((tx) => {
    const walletName =
      tx.walletFrom?.name ?? tx.walletTo?.name ?? "Tidak Diketahui";
    const walletIcon = tx.walletFrom?.icon ?? tx.walletTo?.icon ?? "💳";

    return {
      id: tx.id,
      description: tx.description ?? tx.category.name,
      notes: tx.notes ?? null,
      category: tx.category.name,
      categoryIcon: tx.category.icon,
      categoryColor: tx.category.color,
      type: tx.type as "INCOME" | "EXPENSE" | "TRANSFER",
      amount: Number(tx.amount),
      date: tx.date.toISOString(),
      wallet: walletName,
      walletIcon,
    };
  });

  // ── Response ──────────────────────────────────────────────
  return {
    ok: true,
    isMockData: false,
    generatedAt: now.toISOString(),
    data: {
      balance: {
        total: totalBalanceInBase,
        lastMonth: lastMonthBal,
        changePercent: Math.abs(balChange),
        isPositive: balChange >= 0,
        wallets: formattedWallets,
      },
      monthly: {
        period: currentPeriod,
        income: curIncome,
        expense: curExpense,
        savings,
        savingsRate,
        lastMonthIncome: prevIncome,
        lastMonthExpense: prevExpense,
        incomeChange,
        expenseChange,
        incomeIsPositive: incomeChange >= 0,
        expenseIsPositive: expenseChange >= 0,
      },
      categories,
      recentTransactions: formattedTransactions,
      budgets: budgetData,
    },
  };
});
// server/api/analytics/categories.get.ts
// Returns income + expense category breakdown for a given month/year

import prisma from "~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  // ── Query params ───────────────────────────────────────────
  const query = getQuery(event);

  const now   = new Date();
  const month = query.month ? Number(query.month) : now.getMonth() + 1;
  const year  = query.year  ? Number(query.year)  : now.getFullYear();

  if (
    isNaN(month) || month < 1 || month > 12 ||
    isNaN(year)  || year  < 2000 || year > 2100
  ) {
    throw createError({
      statusCode: 400,
      message: "Parameter month (1-12) dan year tidak valid.",
    });
  }

  // ── Get authenticated user ────────────────────────────────
  const user = await requireAuth(event)

  // ── Date range for selected month ─────────────────────────
  const periodStart = new Date(year, month - 1, 1,  0,  0,  0,   0);
  const periodEnd   = new Date(year, month,     0, 23, 59, 59, 999);

  const MONTHS_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const periodLabel = `${MONTHS_ID[month - 1]} ${year}`;

  // ── Previous month for comparison ─────────────────────────
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const prevStart = new Date(prevYear, prevMonth - 1, 1,  0,  0,  0,   0);
  const prevEnd   = new Date(prevYear, prevMonth,     0, 23, 59, 59, 999);

  // ── Fetch all transactions for both periods (parallel) ────
  const [currentTxs, prevTxs] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date:   { gte: periodStart, lte: periodEnd },
        type:   { in: ["INCOME", "EXPENSE"] },
      },
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    }),

    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date:   { gte: prevStart, lte: prevEnd },
        type:   { in: ["INCOME", "EXPENSE"] },
      },
      select: {
        type:       true,
        amount:     true,
        categoryId: true,
      },
    }),
  ]);

  // ── Aggregate current period by category + type ────────────
  type CatStat = {
    categoryId:       string;
    name:             string;
    icon:             string;
    color:            string;
    type:             "INCOME" | "EXPENSE";
    amount:           number;
    transactionCount: number;
    avgAmount:        number;
    percentage:       number;
  };

  const incomeMap  = new Map<string, CatStat>();
  const expenseMap = new Map<string, CatStat>();

  for (const tx of currentTxs) {
    const map = tx.type === "INCOME" ? incomeMap : expenseMap;
    const key = tx.categoryId;

    const existing = map.get(key);
    if (existing) {
      existing.amount           += Number(tx.amount);
      existing.transactionCount += 1;
    } else {
      map.set(key, {
        categoryId:       tx.categoryId,
        name:             tx.category.name,
        icon:             tx.category.icon,
        color:            tx.category.color,
        type:             tx.type as "INCOME" | "EXPENSE",
        amount:           Number(tx.amount),
        transactionCount: 1,
        avgAmount:        0,
        percentage:       0,
      });
    }
  }

  // ── Aggregate previous period by category ─────────────────
  const prevIncomeMap  = new Map<string, number>();
  const prevExpenseMap = new Map<string, number>();

  for (const tx of prevTxs) {
    const map = tx.type === "INCOME" ? prevIncomeMap : prevExpenseMap;
    map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + Number(tx.amount));
  }

  // ── Finalize percentages & averages ───────────────────────
  const totalIncome  = Array.from(incomeMap.values()) .reduce((s, c) => s + c.amount, 0);
  const totalExpense = Array.from(expenseMap.values()).reduce((s, c) => s + c.amount, 0);

  const finalizeItems = (
    map:   Map<string, CatStat>,
    total: number,
    prevMap: Map<string, number>,
  ) =>
    Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .map((c) => {
        const prevAmt  = prevMap.get(c.categoryId) ?? 0;
        const change   = prevAmt > 0
          ? Math.round(((c.amount - prevAmt) / prevAmt) * 1000) / 10
          : null;

        return {
          ...c,
          avgAmount:  c.transactionCount > 0
            ? Math.round(c.amount / c.transactionCount)
            : 0,
          percentage: total > 0
            ? Math.round((c.amount / total) * 1000) / 10
            : 0,
          prevAmount:       prevAmt,
          changePercent:    change,
          changeIsPositive: c.type === "INCOME"
            ? (change ?? 0) >= 0
            : (change ?? 0) <= 0,   // for expense: less = positive
        };
      });

  const incomeItems  = finalizeItems(incomeMap,  totalIncome,  prevIncomeMap);
  const expenseItems = finalizeItems(expenseMap, totalExpense, prevExpenseMap);

  // ── Month-level totals ─────────────────────────────────────
  const prevTotalIncome  = Array.from(prevIncomeMap.values()) .reduce((s, v) => s + v, 0);
  const prevTotalExpense = Array.from(prevExpenseMap.values()).reduce((s, v) => s + v, 0);

  const savings    = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0
    ? Math.round((savings / totalIncome) * 1000) / 10
    : 0;

  const pctChange = (cur: number, prev: number): number | null =>
    prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;

  // ── Weekly Trend Calculation ──────────────────────────────
  const weeklyTrends = Array.from({ length: 5 }, (_, i) => ({
    week: i + 1,
    label: `Mg ${i + 1}`,
    income: 0,
    expense: 0,
  }));

  for (const tx of currentTxs) {
    const day = tx.date.getDate();
    let weekIndex = Math.floor((day - 1) / 7);
    if (weekIndex > 4) weekIndex = 4; // Days 29-31 go to week 5
    
    if (tx.type === "INCOME") {
      weeklyTrends[weekIndex].income += Number(tx.amount);
    } else if (tx.type === "EXPENSE") {
      weeklyTrends[weekIndex].expense += Number(tx.amount);
    }
  }

  // ── Available months for period selector ──────────────────
  // Returns last 6 months as navigation options
  const availableMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      label: `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`,
      isCurrent: d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(),
    };
  });

  // ── Response ──────────────────────────────────────────────
  return {
    ok:          true,
    generatedAt: now.toISOString(),
    data: {
      period: {
        label:  periodLabel,
        month,
        year,
        isCurrentMonth:
          month === now.getMonth() + 1 && year === now.getFullYear(),
      },
      availableMonths,

      income: {
        total:      totalIncome,
        prevTotal:  prevTotalIncome,
        change:     pctChange(totalIncome, prevTotalIncome),
        isPositive: true,
        items:      incomeItems,
        count:      currentTxs.filter((t) => t.type === "INCOME").length,
      },

      expense: {
        total:      totalExpense,
        prevTotal:  prevTotalExpense,
        change:     pctChange(totalExpense, prevTotalExpense),
        isPositive: false,
        items:      expenseItems,
        count:      currentTxs.filter((t) => t.type === "EXPENSE").length,
      },

      summary: {
        savings,
        savingsRate,
        prevSavings:     prevTotalIncome - prevTotalExpense,
        prevSavingsRate: prevTotalIncome > 0
          ? Math.round(((prevTotalIncome - prevTotalExpense) / prevTotalIncome) * 1000) / 10
          : 0,
        transactionCount: currentTxs.length,
      },

      weeklyTrends,
    },
  };
});

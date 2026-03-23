// server/api/analytics/trends.get.ts
// Returns 6-month aggregated income / expense / savings data

import prisma from "~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  // ── Get authenticated user ────────────────────────────────
  const user = await requireAuth(event)

  const now = new Date();
  const MONTHS_ID = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];

  const periods: { month: number; year: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push({
      month: d.getMonth() + 1,
      year:  d.getFullYear(),
      label: `${MONTHS_ID[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    });
  }

  const windowStart = new Date(periods[0]!.year, periods[0]!.month - 1, 1, 0, 0, 0, 0);
  const windowEnd = new Date(periods[5]!.year, periods[5]!.month, 0, 23, 59, 59, 999);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      type:   { in: ["INCOME", "EXPENSE"] },
      date:   { gte: windowStart, lte: windowEnd },
    },
    select: {
      type:         true,
      amount:       true,
      targetAmount: true,
      date:         true,
    },
  });

  type PeriodStats = {
    label:       string;
    month:       number;
    year:        number;
    income:      number;
    expense:     number;
    savings:     number;
    savingsRate: number;
  };

  const statsMap = new Map<string, PeriodStats>();

  for (const p of periods) {
    const key = `${p.year}-${p.month}`;
    statsMap.set(key, {
      label:       p.label,
      month:       p.month,
      year:        p.year,
      income:      0,
      expense:     0,
      savings:     0,
      savingsRate: 0,
    });
  }

  for (const tx of transactions) {
    const d   = new Date(tx.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const stat = statsMap.get(key);
    if (!stat) continue;

    const amt = Number(tx.targetAmount ?? tx.amount);
    if (tx.type === "INCOME")  stat.income  += amt;
    if (tx.type === "EXPENSE") stat.expense += amt;
  }

  const months: PeriodStats[] = [];
  for (const stat of statsMap.values()) {
    stat.savings     = stat.income - stat.expense;
    stat.savingsRate = stat.income > 0
      ? Math.round((stat.savings / stat.income) * 1000) / 10
      : 0;
    months.push(stat);
  }

  const filledMonths = months.filter((m) => m.income > 0 || m.expense > 0);
  const totalIncome  = months.reduce((s, m) => s + m.income,  0);
  const totalExpense = months.reduce((s, m) => s + m.expense, 0);
  const totalSavings = totalIncome - totalExpense;

  const avgIncome  = filledMonths.length ? Math.round(totalIncome  / filledMonths.length) : 0;
  const avgExpense = filledMonths.length ? Math.round(totalExpense / filledMonths.length) : 0;

  const bestMonth = filledMonths.length ? filledMonths.reduce((a, b) => (a.savings > b.savings ? a : b)) : null;
  const worstMonth = filledMonths.length ? filledMonths.reduce((a, b) => (a.savings < b.savings ? a : b)) : null;

  const last     = months[months.length - 1];
  const prevLast = months[months.length - 2];

  const expenseTrend = prevLast && last && prevLast.expense > 0 ? Math.round(((last.expense - prevLast.expense) / prevLast.expense) * 1000) / 10 : 0;
  const incomeTrend = prevLast && last && prevLast.income > 0 ? Math.round(((last.income - prevLast.income) / prevLast.income) * 1000) / 10 : 0;

  const overallSavingsRate = totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 1000) / 10 : 0;

  return {
    ok:          true,
    generatedAt: now.toISOString(),
    data: {
      months,
      summary: {
        totalIncome,
        totalExpense,
        totalSavings,
        avgIncome,
        avgExpense,
        overallSavingsRate,
        expenseTrend,
        incomeTrend,
        expenseTrendIsPositive: expenseTrend <= 0,
        incomeTrendIsPositive:  incomeTrend  >= 0,
        bestMonth:  bestMonth  ? { label: bestMonth.label,  savings: bestMonth.savings,  savingsRate: bestMonth.savingsRate  } : null,
        worstMonth: worstMonth ? { label: worstMonth.label, savings: worstMonth.savings, savingsRate: worstMonth.savingsRate } : null,
      },
    },
  };
});
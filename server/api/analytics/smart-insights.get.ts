// server/api/analytics/smart-insights.get.ts
// Deep data analysis to generate actionable insights

import prisma from "~/server/utils/prisma";

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // 1. Fetch current month transactions and budgets
  const [transactions, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
        },
      },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { userId: user.id, month: currentMonth, year: currentYear },
      include: { category: true },
    }),
  ]);

  const insights = [];

  // --- Insight 1: Day of Week Analysis ---
  const daySpend: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const DAYS_NAME = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
    const day = t.date.getDay();
    daySpend[day]! += Number(t.amount);
  });

  let maxDay = 0;
  let maxAmount = 0;
  for (let d = 0; d < 7; d++) {
    if (daySpend[d]! > maxAmount) {
      maxAmount = daySpend[d]!;
      maxDay = d;
    }
  }

  if (maxAmount > 0) {
    insights.push({
      id: 'heavy-day',
      icon: '📅',
      title: `Hari Boros: ${DAYS_NAME[maxDay]}`,
      description: `Kamu paling banyak belanja di hari ${DAYS_NAME[maxDay]}. Coba lebih waspada saat akhir pekan tiba!`,
      type: 'info'
    });
  }

  // --- Insight 2: Large Transaction Detection ---
  const expenses = transactions.filter(t => t.type === 'EXPENSE');
  if (expenses.length > 0) {
    const avgExpense = expenses.reduce((s, t) => s + Number(t.amount), 0) / expenses.length;
    const largeTx = expenses.find(t => Number(t.amount) > avgExpense * 3);
    
    if (largeTx) {
      insights.push({
        id: 'large-tx',
        icon: '🚨',
        title: 'Deteksi Pengeluaran Besar',
        description: `Ada transaksi ${largeTx.category.name} sebesar Rp ${Number(largeTx.amount).toLocaleString('id-ID')} yang jauh di atas rata-rata belanjamu.`,
        type: 'warning'
      });
    }
  }

  // --- Insight 3: Budget Health ---
  for (const b of budgets) {
    const spent = Number(b.spent);
    const limit = Number(b.amount);
    const pct = (spent / limit) * 100;

    if (pct >= 100) {
      insights.push({
        id: `budget-over-${b.id}`,
        icon: '🚫',
        title: `Budget ${b.category.name} Habis`,
        description: `Kamu sudah melewati batas budget untuk ${b.category.name}. Stop pengeluaran di kategori ini jika memungkinkan.`,
        type: 'danger'
      });
    } else if (pct >= 85) {
      insights.push({
        id: `budget-warning-${b.id}`,
        icon: '⚠️',
        title: `Budget ${b.category.name} Menipis`,
        description: `Sisa budget ${b.category.name} tinggal sedikit lagi (${Math.round(100 - pct)}%). Yuk, lebih hemat!`,
        type: 'warning'
      });
    }
  }

  return { ok: true, data: insights };
});

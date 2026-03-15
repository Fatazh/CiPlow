<script setup lang="ts">
// ── Types ──────────────────────────────────────────────────────
interface TrendSummary {
  totalIncome: number
  totalExpense: number
  totalSavings: number
  avgIncome: number
  avgExpense: number
  overallSavingsRate: number
  expenseTrend: number
  incomeTrend: number
  expenseTrendIsPositive: boolean
  incomeTrendIsPositive: boolean
  bestMonth: { label: string; savings: number; savingsRate: number } | null
  worstMonth: { label: string; savings: number; savingsRate: number } | null
}

interface TopExpense {
  name: string
  icon: string
  amount: number
  percentage: number
  changePercent: number | null
  changeIsPositive: boolean
}

interface Props {
  trendSummary: TrendSummary | null
  topExpense: TopExpense | null
  currentSavingsRate: number
  currentSavings: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  trendSummary: null,
  topExpense: null,
  currentSavingsRate: 0,
  currentSavings: 0,
  loading: false,
})

// ── Composables ────────────────────────────────────────────────
const { formatCompact } = useCurrency()

// ── Insight types ──────────────────────────────────────────────
type InsightType = 'good' | 'warning' | 'danger' | 'info'

interface Insight {
  id: string
  icon: string
  title: string
  description: string
  type: InsightType
}

// ── Insight generation ─────────────────────────────────────────
const insights = computed<Insight[]>(() => {
  const list: Insight[] = []

  // ── 1. Savings rate insight ────────────────────────────────
  const rate = props.currentSavingsRate
  if (rate >= 20) {
    list.push({
      id: 'savings-good',
      icon: '🎯',
      title: 'Tabungan Sehat!',
      description: `Kamu menabung ${rate.toFixed(1)}% dari pemasukan bulan ini. Pertahankan kebiasaan baik ini!`,
      type: 'good',
    })
  } else if (rate >= 10) {
    list.push({
      id: 'savings-ok',
      icon: '📈',
      title: 'Tabungan Cukup',
      description: `Tabungan ${rate.toFixed(1)}% sudah lumayan. Idealnya mencapai 20% atau lebih untuk kondisi keuangan optimal.`,
      type: 'info',
    })
  } else if (rate > 0) {
    list.push({
      id: 'savings-low',
      icon: '⚠️',
      title: 'Tabungan Masih Rendah',
      description: `Hanya ${rate.toFixed(1)}% dari pemasukan yang ditabung bulan ini. Coba kurangi pengeluaran tidak penting.`,
      type: 'warning',
    })
  } else {
    list.push({
      id: 'savings-negative',
      icon: '🚨',
      title: 'Pengeluaran Melebihi Pemasukan!',
      description: `Kamu boros ${formatCompact(Math.abs(props.currentSavings))} bulan ini. Segera evaluasi dan pangkas pengeluaran.`,
      type: 'danger',
    })
  }

  // ── 2. Top expense category ────────────────────────────────
  const top = props.topExpense
  if (top) {
    if (top.percentage >= 40) {
      const extra =
        top.changePercent !== null && !top.changeIsPositive
          ? ` Naik ${Math.abs(top.changePercent)}% dari bulan lalu.`
          : ''
      list.push({
        id: 'top-cat-dominant',
        icon: top.icon,
        title: `${top.name} Mendominasi`,
        description: `${top.icon} ${top.name} menyumbang ${top.percentage.toFixed(0)}% dari total pengeluaran.${extra} Pertimbangkan untuk membatasinya.`,
        type: 'warning',
      })
    } else {
      const extra =
        top.changePercent !== null && !top.changeIsPositive
          ? ` (naik ${Math.abs(top.changePercent)}% dari bulan lalu)`
          : ''
      list.push({
        id: 'top-cat-info',
        icon: top.icon,
        title: 'Pengeluaran Terbesar',
        description: `${top.icon} ${top.name} (${top.percentage.toFixed(0)}%) adalah kategori terbesar bulan ini${extra}.`,
        type: 'info',
      })
    }
  }

  // ── 3. Expense trend ───────────────────────────────────────
  const trend = props.trendSummary
  if (trend) {
    const et = trend.expenseTrend
    if (et <= -10) {
      list.push({
        id: 'expense-down',
        icon: '✂️',
        title: 'Pengeluaran Berhasil Turun',
        description: `Pengeluaran turun ${Math.abs(et)}% dari bulan lalu. Kerja bagus memangkas pengeluaran!`,
        type: 'good',
      })
    } else if (et >= 20) {
      list.push({
        id: 'expense-spike',
        icon: '📈',
        title: 'Pengeluaran Melonjak!',
        description: `Pengeluaran naik ${et}% dari bulan lalu. Segera cek kategori mana yang membengkak.`,
        type: 'danger',
      })
    } else if (et >= 10) {
      list.push({
        id: 'expense-rising',
        icon: '⬆️',
        title: 'Pengeluaran Meningkat',
        description: `Pengeluaran naik ${et}% dari bulan lalu. Mulai waspadai tren ini sebelum makin besar.`,
        type: 'warning',
      })
    }

    // ── 4. Income trend ──────────────────────────────────────
    const it = trend.incomeTrend
    if (it >= 10) {
      list.push({
        id: 'income-up',
        icon: '💰',
        title: 'Pemasukan Meningkat',
        description: `Pemasukan naik ${it}% dari bulan lalu. Manfaatkan kenaikan ini untuk memperbesar tabungan!`,
        type: 'good',
      })
    } else if (it <= -10) {
      list.push({
        id: 'income-down',
        icon: '📉',
        title: 'Pemasukan Menurun',
        description: `Pemasukan turun ${Math.abs(it)}% dari bulan lalu. Pastikan pengeluaran menyesuaikan.`,
        type: 'warning',
      })
    }

    // ── 5. Overall savings rate (6-month) ────────────────────
    const osr = trend.overallSavingsRate
    if (osr >= 25) {
      list.push({
        id: 'overall-great',
        icon: '🌟',
        title: 'Keuangan 6 Bulan Sangat Baik',
        description: `Rata-rata tabungan ${osr.toFixed(1)}% selama 6 bulan terakhir. Kamu berada di jalur yang tepat!`,
        type: 'good',
      })
    } else if (osr < 5 && osr > -100) {
      list.push({
        id: 'overall-poor',
        icon: '🔔',
        title: 'Tabungan 6 Bulan Rendah',
        description: `Rata-rata tabungan hanya ${osr.toFixed(1)}% selama 6 bulan. Evaluasi pola pengeluaran secara menyeluruh.`,
        type: 'warning',
      })
    }

    // ── 6. Best month highlight ──────────────────────────────
    if (trend.bestMonth && trend.bestMonth.savings > 0) {
      list.push({
        id: 'best-month',
        icon: '🏆',
        title: `Bulan Terbaik: ${trend.bestMonth.label}`,
        description: `Tabungan tertinggi ${formatCompact(trend.bestMonth.savings)} (${trend.bestMonth.savingsRate}%). Jadikan ini sebagai target!`,
        type: 'info',
      })
    }
  }

  // Limit to 5 most relevant insights
  return list.slice(0, 5)
})

// ── Type style map ─────────────────────────────────────────────
const typeStyle: Record<InsightType, { dot: string; bg: string; border: string; title: string }> = {
  good: {
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    title: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-100 dark:border-amber-900/40',
    title: 'text-amber-700 dark:text-amber-300',
  },
  danger: {
    dot: 'bg-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-100 dark:border-rose-900/40',
    title: 'text-rose-700 dark:text-rose-300',
  },
  info: {
    dot: 'bg-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-100 dark:border-blue-900/40',
    title: 'text-blue-700 dark:text-blue-300',
  },
}
</script>

<template>
  <!-- ── Skeleton ────────────────────────────────────────────── -->
  <div v-if="loading" class="card rounded-2xl p-4 animate-pulse space-y-4">
    <!-- Header -->
    <div class="space-y-1.5">
      <div class="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div class="h-3 w-60 bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
    <!-- Insight rows -->
    <div
      v-for="i in 3"
      :key="i"
      class="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
      :style="{ opacity: 1 - i * 0.2 }"
    >
      <div class="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div class="flex-1 space-y-1.5 pt-0.5">
        <div class="h-3.5 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div class="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full" />
        <div class="h-3 w-3/4 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
    </div>
  </div>

  <!-- ── Card ───────────────────────────────────────────────── -->
  <div v-else class="card rounded-2xl p-4 animate-fade-in">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="mb-4">
      <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
        <span class="text-base leading-none">💡</span>
        Insight Keuangan
      </h3>
      <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
        Rekomendasi berdasarkan data kamu
      </p>
    </div>

    <!-- ── Empty state ─────────────────────────────────────── -->
    <div
      v-if="!insights.length"
      class="
        flex flex-col items-center justify-center py-10 text-center
        bg-gray-50 dark:bg-gray-800/40 rounded-2xl
      "
    >
      <span class="text-3xl mb-2">🔍</span>
      <p class="text-sm font-semibold text-gray-500 dark:text-gray-400">
        Belum cukup data
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[220px]">
        Tambah lebih banyak transaksi untuk mendapatkan insight keuangan
      </p>
    </div>

    <!-- ── Insight list ────────────────────────────────────── -->
    <div v-else class="space-y-2.5">
      <div
        v-for="(insight, idx) in insights"
        :key="insight.id"
        class="
          flex items-start gap-3 p-3 rounded-2xl border
          transition-all duration-200
          animate-fade-in
        "
        :class="[typeStyle[insight.type].bg, typeStyle[insight.type].border]"
        :style="{ animationDelay: `${idx * 60}ms` }"
      >
        <!-- Icon bubble -->
        <div
          class="
            flex-shrink-0 w-9 h-9 rounded-xl
            flex items-center justify-center
            text-lg leading-none
            bg-white/60 dark:bg-black/20
            shadow-sm
          "
        >
          {{ insight.icon }}
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0 pt-0.5">
          <div class="flex items-center gap-2 mb-0.5">
            <p
              class="text-xs font-bold leading-snug"
              :class="typeStyle[insight.type].title"
            >
              {{ insight.title }}
            </p>
            <!-- Type dot -->
            <span
              class="flex-shrink-0 w-1.5 h-1.5 rounded-full"
              :class="typeStyle[insight.type].dot"
            />
          </div>
          <p class="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
            {{ insight.description }}
          </p>
        </div>
      </div>
    </div>

    <!-- ── Footer note ─────────────────────────────────────── -->
    <p
      v-if="insights.length"
      class="
        mt-4 pt-3
        border-t border-gray-100 dark:border-gray-800
        text-[10px] text-center text-gray-300 dark:text-gray-600
        font-medium
      "
    >
      Insight dihitung otomatis dari data transaksi kamu
    </p>

  </div>
</template>

<script setup lang="ts">
import { Chart } from 'vue-chartjs'
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-vue-next'
import type { ChartOptions } from 'chart.js'

// ── Types ──────────────────────────────────────────────────────
interface MonthStat {
  label: string
  month: number
  year: number
  income: number
  expense: number
  savings: number
  savingsRate: number
}

interface Props {
  months: MonthStat[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  months: () => [],
  loading: false,
})

// ── Composables ────────────────────────────────────────────────
const { formatCompact } = useCurrency()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// ── Legend toggles ─────────────────────────────────────────────
const visible = reactive({ income: true, expense: true, savings: true })

const LEGENDS = [
  { key: 'income'  as const, label: 'Pemasukan',  color: '#10b981' },
  { key: 'expense' as const, label: 'Pengeluaran', color: '#f43f5e' },
  { key: 'savings' as const, label: 'Tabungan',    color: '#06b6d4' },
]

// ── Chart data ─────────────────────────────────────────────────
const chartData = computed(() => ({
  labels: props.months.map((m) => m.label),
  datasets: [
    {
      type: 'bar' as const,
      label: 'Pemasukan',
      data: props.months.map((m) => (visible.income  ? m.income  : null)),
      backgroundColor: isDark.value
        ? 'rgba(16, 185, 129, 0.75)'
        : 'rgba(16, 185, 129, 0.88)',
      hoverBackgroundColor: '#10b981',
      borderRadius: 6,
      borderSkipped: false,
      order: 2,
      barPercentage: 0.65,
      categoryPercentage: 0.75,
    },
    {
      type: 'bar' as const,
      label: 'Pengeluaran',
      data: props.months.map((m) => (visible.expense ? m.expense : null)),
      backgroundColor: isDark.value
        ? 'rgba(244, 63, 94, 0.70)'
        : 'rgba(244, 63, 94, 0.85)',
      hoverBackgroundColor: '#f43f5e',
      borderRadius: 6,
      borderSkipped: false,
      order: 2,
      barPercentage: 0.65,
      categoryPercentage: 0.75,
    },
    {
      type: 'line' as const,
      label: 'Tabungan',
      data: props.months.map((m) => (visible.savings ? m.savings : null)),
      borderColor: '#06b6d4',
      backgroundColor: isDark.value
        ? 'rgba(6, 182, 212, 0.10)'
        : 'rgba(6, 182, 212, 0.08)',
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: isDark.value ? '#0f172a' : '#ffffff',
      pointBorderWidth: 2,
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      order: 1,
    },
  ],
}))

// ── Chart options ───────────────────────────────────────────────
const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const val = ctx.parsed.y
          if (val === null || val === undefined) return ''
          return ` ${ctx.dataset.label}: ${formatCompact(val)}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: isDark.value ? '#475569' : '#94a3b8',
        font: { size: 11, weight: 500 },
        maxRotation: 0,
      },
    },
    y: {
      grid: {
        color: isDark.value
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0,0,0,0.04)',
      },
      border: { display: false, dash: [4, 4] },
      ticks: {
        color: isDark.value ? '#475569' : '#94a3b8',
        font: { size: 10 },
        maxTicksLimit: 5,
        callback: (v) => formatCompact(Number(v)),
      },
    },
  },
}))

// ── Summary row (last month) ───────────────────────────────────
const last = computed(() => props.months[props.months.length - 1] ?? null)
const prev = computed(() => props.months[props.months.length - 2] ?? null)

const expenseChange = computed(() => {
  if (!last.value || !prev.value || prev.value.expense === 0) return null
  return Math.round(((last.value.expense - prev.value.expense) / prev.value.expense) * 1000) / 10
})

const incomeChange = computed(() => {
  if (!last.value || !prev.value || prev.value.income === 0) return null
  return Math.round(((last.value.income - prev.value.income) / prev.value.income) * 1000) / 10
})
</script>

<template>
  <!-- ── Skeleton ────────────────────────────────────────────── -->
  <div v-if="loading" class="card rounded-2xl p-4 animate-pulse space-y-4">
    <div class="space-y-1">
      <div class="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div class="h-3 w-52 bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
    <div class="h-52 bg-gray-100 dark:bg-gray-800/60 rounded-xl" />
    <div class="flex justify-center gap-3">
      <div v-for="i in 3" :key="i" class="h-7 w-24 bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
  </div>

  <!-- ── Card ───────────────────────────────────────────────── -->
  <div v-else class="card rounded-2xl p-4 animate-fade-in">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Tren 6 Bulan
        </h3>
        <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          Pemasukan, pengeluaran &amp; tabungan
        </p>
      </div>

      <!-- Last month quick stats -->
      <div v-if="last" class="flex flex-col items-end gap-1">
        <!-- Income change -->
        <div
          v-if="incomeChange !== null"
          class="flex items-center gap-1 text-[10px] font-semibold"
          :class="incomeChange >= 0 ? 'text-emerald-500' : 'text-rose-500'"
        >
          <TrendingUpIcon v-if="incomeChange >= 0" :size="11" :stroke-width="2.5" />
          <TrendingDownIcon v-else                  :size="11" :stroke-width="2.5" />
          <span>{{ incomeChange >= 0 ? '+' : '' }}{{ incomeChange }}%</span>
        </div>
        <!-- Expense change -->
        <div
          v-if="expenseChange !== null"
          class="flex items-center gap-1 text-[10px] font-semibold"
          :class="expenseChange <= 0 ? 'text-emerald-500' : 'text-rose-500'"
        >
          <TrendingDownIcon v-if="expenseChange <= 0" :size="11" :stroke-width="2.5" />
          <TrendingUpIcon   v-else                     :size="11" :stroke-width="2.5" />
          <span>{{ expenseChange >= 0 ? '+' : '' }}{{ expenseChange }}%</span>
        </div>
      </div>
    </div>

    <!-- ── Chart ────────────────────────────────────────────── -->
    <div class="h-52 w-full">
      <ClientOnly>
        <Chart
          type="bar"
          :data="chartData"
          :options="(chartOptions as any)"
          class="w-full h-full"
        />
        <template #fallback>
          <div class="h-52 bg-gray-100 dark:bg-gray-800/60 rounded-xl animate-pulse" />
        </template>
      </ClientOnly>
    </div>

    <!-- ── Legend toggles ───────────────────────────────────── -->
    <div class="flex items-center justify-center gap-2 mt-4 flex-wrap">
      <button
        v-for="item in LEGENDS"
        :key="item.key"
        class="
          flex items-center gap-1.5 px-3 py-1.5 rounded-full
          text-xs font-semibold
          border transition-all duration-150 active:scale-90
          select-none
        "
        :class="
          visible[item.key]
            ? 'border-transparent bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
            : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-400 dark:text-gray-600'
        "
        @click="visible[item.key] = !visible[item.key]"
      >
        <span
          class="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-opacity duration-150"
          :style="{ backgroundColor: item.color }"
          :class="visible[item.key] ? 'opacity-100' : 'opacity-25'"
        />
        {{ item.label }}
      </button>
    </div>

    <!-- ── 6-month totals row ────────────────────────────────── -->
    <div
      v-if="months.length"
      class="
        mt-4 pt-4
        border-t border-gray-100 dark:border-gray-800
        grid grid-cols-3 gap-2
      "
    >
      <div
        v-for="item in [
          {
            label: 'Total Masuk',
            value: months.reduce((s, m) => s + m.income, 0),
            colorClass: 'text-emerald-500',
          },
          {
            label: 'Total Keluar',
            value: months.reduce((s, m) => s + m.expense, 0),
            colorClass: 'text-rose-500',
          },
          {
            label: 'Net Tabungan',
            value: months.reduce((s, m) => s + m.savings, 0),
            colorClass: months.reduce((s, m) => s + m.savings, 0) >= 0
              ? 'text-cyan-500'
              : 'text-rose-500',
          },
        ]"
        :key="item.label"
        class="flex flex-col items-center gap-0.5"
      >
        <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
          {{ item.label }}
        </span>
        <span
          class="text-xs font-bold"
          :class="item.colorClass"
        >
          {{ formatCompact(item.value) }}
        </span>
      </div>
    </div>

  </div>
</template>

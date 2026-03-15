<script setup lang="ts">
import { Chart } from 'vue-chartjs'
import type { ChartOptions } from 'chart.js'

// ── Types ──────────────────────────────────────────────────────
interface WeekStat {
  week: number
  label: string
  income: number
  expense: number
}

interface Props {
  weeks: WeekStat[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  weeks: () => [],
  loading: false,
})

// ── Composables ────────────────────────────────────────────────
const { formatCompact } = useCurrency()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// ── Legend toggles ─────────────────────────────────────────────
const visible = reactive({ income: true, expense: true })

const LEGENDS = [
  { key: 'income'  as const, label: 'Pemasukan',  color: '#10b981' },
  { key: 'expense' as const, label: 'Pengeluaran', color: '#f43f5e' },
]

// ── Chart data ─────────────────────────────────────────────────
const chartData = computed(() => ({
  labels: props.weeks.map((w) => w.label),
  datasets: [
    {
      type: 'bar' as const,
      label: 'Pemasukan',
      data: props.weeks.map((w) => (visible.income  ? w.income  : null)),
      backgroundColor: isDark.value
        ? 'rgba(16, 185, 129, 0.75)'
        : 'rgba(16, 185, 129, 0.88)',
      hoverBackgroundColor: '#10b981',
      borderRadius: 4,
      borderSkipped: false,
      barPercentage: 0.65,
      categoryPercentage: 0.75,
    },
    {
      type: 'bar' as const,
      label: 'Pengeluaran',
      data: props.weeks.map((w) => (visible.expense ? w.expense : null)),
      backgroundColor: isDark.value
        ? 'rgba(244, 63, 94, 0.70)'
        : 'rgba(244, 63, 94, 0.85)',
      hoverBackgroundColor: '#f43f5e',
      borderRadius: 4,
      borderSkipped: false,
      barPercentage: 0.65,
      categoryPercentage: 0.75,
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
        font: { size: 10, weight: 500 },
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
</script>

<template>
  <!-- ── Skeleton ────────────────────────────────────────────── -->
  <div v-if="loading" class="card rounded-2xl p-4 animate-pulse space-y-4">
    <div class="space-y-1">
      <div class="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div class="h-3 w-52 bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
    <div class="h-40 bg-gray-100 dark:bg-gray-800/60 rounded-xl" />
    <div class="flex justify-center gap-3">
      <div v-for="i in 2" :key="i" class="h-7 w-24 bg-gray-100 dark:bg-gray-800 rounded-full" />
    </div>
  </div>

  <!-- ── Card ───────────────────────────────────────────────── -->
  <div v-else class="card rounded-2xl p-4 animate-fade-in">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Tren Mingguan
        </h3>
        <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          Pemasukan &amp; pengeluaran bulan ini
        </p>
      </div>
    </div>

    <!-- ── Chart ────────────────────────────────────────────── -->
    <div class="h-40 w-full">
      <ClientOnly>
        <Chart
          type="bar"
          :data="chartData"
          :options="(chartOptions as any)"
          class="w-full h-full"
        />
        <template #fallback>
          <div class="h-40 bg-gray-100 dark:bg-gray-800/60 rounded-xl animate-pulse" />
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
          class="w-2 h-2 rounded-full flex-shrink-0 transition-opacity duration-150"
          :style="{ backgroundColor: item.color }"
          :class="visible[item.key] ? 'opacity-100' : 'opacity-25'"
        />
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
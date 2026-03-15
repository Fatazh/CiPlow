<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { ChevronRightIcon } from 'lucide-vue-next'
import type { ChartData, ChartOptions } from 'chart.js'

// ── Props ──────────────────────────────────────────────────────
interface Category {
  id: string
  name: string
  amount: number
  percentage: number
  color: string
  darkColor: string
  icon: string
  type: string
}

interface Props {
  categories?: Category[]
  totalExpense?: number
  period?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  categories: () => [],
  totalExpense: 0,
  period: '',
  loading: false,
})

// ── Currency ────────────────────────────────────────────────────
const { formatCompact, formatIDR } = useCurrency()

// ── Dark mode awareness ────────────────────────────────────────
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// ── Chart data ─────────────────────────────────────────────────
const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: props.categories.map((c) => c.name),
  datasets: [
    {
      data: props.categories.map((c) => c.amount),
      backgroundColor: props.categories.map((c) =>
        isDark.value ? c.darkColor : c.color,
      ),
      hoverBackgroundColor: props.categories.map((c) =>
        isDark.value ? c.color : c.darkColor,
      ),
      borderWidth: 0,
      hoverOffset: 8,
      borderRadius: 4,
      spacing: 2,
    },
  ],
}))

// ── Chart options ───────────────────────────────────────────────
const chartOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: true,
  cutout: '72%',
  animation: {
    animateRotate: true,
    animateScale: false,
    duration: 700,
    easing: 'easeInOutQuart',
  },
  plugins: {
    legend: {
      display: false, // Custom legend below
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const cat = props.categories[ctx.dataIndex]
          return ` ${formatIDR(cat.amount)}  (${cat.percentage.toFixed(1)}%)`
        },
        title: (items) => {
          const cat = props.categories[items[0].dataIndex]
          return `${cat.icon}  ${cat.name}`
        },
      },
    },
  },
}))

// ── Active category (hover on legend) ─────────────────────────
const activeIndex = ref<number | null>(null)

const setActive = (i: number | null) => {
  activeIndex.value = i
}

// ── Top 5 for legend (rest grouped as "Lainnya") ───────────────
const TOP_N = 5

const legendItems = computed(() => {
  if (props.categories.length <= TOP_N) return props.categories

  const top = props.categories.slice(0, TOP_N)
  const rest = props.categories.slice(TOP_N)
  const restAmount = rest.reduce((s, c) => s + c.amount, 0)
  const restPct = rest.reduce((s, c) => s + c.percentage, 0)

  return [
    ...top,
    {
      id: 'other',
      name: 'Lainnya',
      amount: restAmount,
      percentage: restPct,
      color: '#6b7280',
      darkColor: '#9ca3af',
      icon: '📦',
      type: 'EXPENSE',
    },
  ]
})

// ── Largest category ───────────────────────────────────────────
const largest = computed(() => {
  if (!props.categories.length) return null
  return props.categories.reduce((a, b) => (a.amount > b.amount ? a : b))
})
</script>

<template>
  <!-- ── Skeleton ────────────────────────────────────────────── -->
  <div v-if="loading" class="card rounded-2xl p-4 animate-pulse">
    <div class="flex items-center justify-between mb-4">
      <div class="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
    <div class="flex gap-4">
      <div class="w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div class="flex-1 space-y-3 pt-1">
        <div v-for="i in 5" :key="i" class="flex items-center gap-2">
          <div class="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div
            class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full"
            :style="{ width: `${55 + i * 8}%` }"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- ── Card ───────────────────────────────────────────────── -->
  <div v-else class="card rounded-2xl p-4 animate-fade-in" style="animation-delay: 120ms;">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Kategori Pengeluaran
        </h3>
        <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          {{ period }}
        </p>
      </div>

      <NuxtLink
        to="/analytics"
        class="
          flex items-center gap-0.5
          text-xs font-semibold text-primary-500
          hover:text-primary-600
          transition-colors duration-150
        "
      >
        Detail
        <ChevronRightIcon :size="14" :stroke-width="2.5" />
      </NuxtLink>
    </div>

    <!-- ── Empty state ─────────────────────────────────────── -->
    <div
      v-if="!categories.length"
      class="flex flex-col items-center justify-center py-10 text-center"
    >
      <span class="text-4xl mb-3">📊</span>
      <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
        Belum ada pengeluaran bulan ini
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Tambahkan transaksi untuk melihat grafik
      </p>
    </div>

    <!-- ── Chart + Legend ──────────────────────────────────── -->
    <div v-else class="flex items-start gap-4">

      <!-- ── Doughnut chart ─────────────────────────────────── -->
      <div class="relative flex-shrink-0 w-[140px] h-[140px]">
        <ClientOnly>
          <Doughnut
            :data="chartData"
            :options="chartOptions"
            class="w-full h-full"
          />
        </ClientOnly>

        <!-- ── Center label ─────────────────────────────────── -->
        <div
          class="
            absolute inset-0
            flex flex-col items-center justify-center
            pointer-events-none
          "
        >
          <template v-if="activeIndex !== null && categories[activeIndex]">
            <!-- Show hovered category -->
            <span class="text-xl leading-none mb-1">
              {{ categories[activeIndex]?.icon }}
            </span>
            <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight max-w-[72px]">
              {{ formatCompact(categories[activeIndex]?.amount) }}
            </span>
            <span class="text-[9px] text-gray-400 dark:text-gray-500 font-medium text-center leading-tight max-w-[72px] mt-0.5">
              {{ categories[activeIndex]?.percentage.toFixed(1) }}%
            </span>
          </template>

          <template v-else-if="largest">
            <!-- Default: show largest category -->
            <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-none mb-1">
              Total
            </span>
            <span class="text-[13px] font-bold text-gray-800 dark:text-gray-100 leading-tight text-center">
              {{ formatCompact(totalExpense) }}
            </span>
          </template>
        </div>
      </div>

      <!-- ── Legend ─────────────────────────────────────────── -->
      <div class="flex-1 flex flex-col gap-1.5 min-w-0 pt-0.5">
        <button
          v-for="(cat, i) in legendItems"
          :key="cat.id"
          class="
            flex items-center gap-2.5
            w-full text-left rounded-xl p-1.5
            transition-all duration-150
            active:scale-95
          "
          :class="
            activeIndex === i
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          "
          @mouseenter="setActive(i)"
          @mouseleave="setActive(null)"
          @focus="setActive(i)"
          @blur="setActive(null)"
        >
          <!-- Color dot -->
          <span
            class="
              flex-shrink-0
              w-2.5 h-2.5 rounded-full
              transition-transform duration-150
            "
            :class="activeIndex === i ? 'scale-125' : ''"
            :style="{
              backgroundColor: isDark ? cat.darkColor : cat.color,
            }"
          />

          <!-- Category name -->
          <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300 flex-1 truncate leading-none">
            {{ cat.icon }} {{ cat.name }}
          </span>

          <!-- Percentage -->
          <span
            class="
              flex-shrink-0
              text-[11px] font-semibold
              text-gray-500 dark:text-gray-400
            "
          >
            {{ cat.percentage.toFixed(0) }}%
          </span>
        </button>
      </div>
    </div>

  </div>
</template>

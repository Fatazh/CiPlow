<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { ChevronRightIcon } from 'lucide-vue-next'
import type { ChartData, ChartOptions } from 'chart.js'

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

const { formatCompact, formatIDR } = useCurrency()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const TOP_N = 5

const groupedItems = computed<Category[]>(() => {
  if (props.categories.length <= TOP_N) return props.categories

  const topItems = props.categories.slice(0, TOP_N)
  const remainingItems = props.categories.slice(TOP_N)

  return [
    ...topItems,
    {
      id: 'other',
      name: 'Lainnya',
      amount: remainingItems.reduce((sum, item) => sum + item.amount, 0),
      percentage: remainingItems.reduce(
        (sum, item) => sum + item.percentage,
        0,
      ),
      color: '#6b7280',
      darkColor: '#9ca3af',
      icon: '📦',
      type: 'EXPENSE',
    },
  ]
})

const activeIndex = ref<number | null>(null)

const setActive = (index: number | null) => {
  activeIndex.value = index
}

const activeItem = computed(() => {
  if (activeIndex.value === null) return null
  return groupedItems.value[activeIndex.value] ?? null
})

const chartData = computed<ChartData<'doughnut'>>(() => ({
  labels: groupedItems.value.map((item) => item.name),
  datasets: [
    {
      data: groupedItems.value.map((item) => item.amount),
      backgroundColor: groupedItems.value.map((item) =>
        isDark.value ? item.darkColor : item.color,
      ),
      hoverBackgroundColor: groupedItems.value.map((item) =>
        isDark.value ? item.color : item.darkColor,
      ),
      borderWidth: 0,
      hoverOffset: 8,
      borderRadius: 4,
      spacing: 2,
    },
  ],
}))

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
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const item = groupedItems.value[ctx.dataIndex]
          if (!item) return ''
          return ` ${formatIDR(item.amount)} (${item.percentage.toFixed(1)}%)`
        },
        title: (items) => {
          const item = items[0]
            ? groupedItems.value[items[0].dataIndex]
            : undefined
          if (!item) return ''
          return `${item.icon} ${item.name}`
        },
      },
    },
  },
}))

const largest = computed(() => {
  if (!props.categories.length) return null
  return props.categories.reduce((prev, next) =>
    prev.amount > next.amount ? prev : next,
  )
})
</script>

<template>
  <div v-if="loading" class="card rounded-2xl p-4 animate-pulse">
    <div class="flex items-center justify-between mb-4">
      <div class="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
    <div class="flex gap-4">
      <div
        class="w-36 h-36 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"
      />
      <div class="flex-1 space-y-3 pt-1">
        <div v-for="i in 5" :key="i" class="flex items-center gap-2">
          <div
            class="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"
          />
          <div
            class="h-3 bg-gray-200 dark:bg-gray-700 rounded-full"
            :style="{ width: `${55 + i * 8}%` }"
          />
        </div>
      </div>
    </div>
  </div>

  <div
    v-else
    class="card rounded-2xl p-4 animate-fade-in"
    style="animation-delay: 120ms"
  >
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
        class="flex items-center gap-0.5 text-xs font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-150"
      >
        Detail
        <ChevronRightIcon :size="14" :stroke-width="2.5" />
      </NuxtLink>
    </div>

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

    <div v-else class="flex items-start gap-4">
      <div class="relative flex-shrink-0 w-[140px] h-[140px]">
        <ClientOnly>
          <Doughnut
            :data="chartData"
            :options="chartOptions"
            class="w-full h-full"
          />
          <template #fallback>
            <div
              class="w-[140px] h-[140px] rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          </template>
        </ClientOnly>

        <div
          class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <template v-if="activeItem">
            <span class="text-xl leading-none mb-1">
              {{ activeItem.icon }}
            </span>
            <span
              class="text-[11px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight max-w-[72px]"
            >
              {{ formatCompact(activeItem.amount) }}
            </span>
            <span
              class="text-[9px] text-gray-400 dark:text-gray-500 font-medium text-center leading-tight max-w-[72px] mt-0.5"
            >
              {{ activeItem.percentage.toFixed(1) }}%
            </span>
          </template>

          <template v-else-if="largest">
            <span
              class="text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-none mb-1"
            >
              Total
            </span>
            <span
              class="text-[13px] font-bold text-gray-800 dark:text-gray-100 leading-tight text-center"
            >
              {{ formatCompact(totalExpense) }}
            </span>
          </template>
        </div>
      </div>

      <div class="flex-1 flex flex-col gap-1.5 min-w-0 pt-0.5">
        <button
          v-for="(cat, i) in groupedItems"
          :key="cat.id"
          class="flex items-center gap-2.5 w-full text-left rounded-xl p-1.5 transition-all duration-150 active:scale-95"
          :class="
            activeIndex === i
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          "
          @mouseenter="setActive(i)"
          @mouseleave="setActive(null)"
          @focus="setActive(i)"
          @blur="setActive(null)"
          @touchstart.passive="setActive(i)"
          @touchend.passive="setActive(null)"
        >
          <span
            class="flex-shrink-0 w-2.5 h-2.5 rounded-full transition-transform duration-150"
            :class="activeIndex === i ? 'scale-125' : ''"
            :style="{ backgroundColor: isDark ? cat.darkColor : cat.color }"
          />

          <span
            class="text-[11px] font-medium text-gray-700 dark:text-gray-300 flex-1 truncate leading-none"
          >
            {{ cat.icon }} {{ cat.name }}
          </span>

          <span
            class="flex-shrink-0 text-[11px] font-semibold text-gray-500 dark:text-gray-400"
          >
            {{ cat.percentage.toFixed(0) }}%
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

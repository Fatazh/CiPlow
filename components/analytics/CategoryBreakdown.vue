<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { TrendingUpIcon, TrendingDownIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-vue-next'
import type { ChartData, ChartOptions } from 'chart.js'

// ── Types ──────────────────────────────────────────────────────
interface CategoryItem {
  categoryId: string
  name: string
  icon: string
  color: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  transactionCount: number
  avgAmount: number
  percentage: number
  prevAmount: number
  changePercent: number | null
  changeIsPositive: boolean
}

interface SideData {
  total: number
  prevTotal: number
  change: number | null
  items: CategoryItem[]
  count: number
}

interface Props {
  income: SideData
  expense: SideData
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// ── Composables ────────────────────────────────────────────────
const { formatCompact, formatIDR } = useCurrency()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// ── Tabs ───────────────────────────────────────────────────────
type Tab = 'expense' | 'income'
const activeTab = ref<Tab>('expense')

const current = computed<SideData>(() =>
  activeTab.value === 'income' ? props.income : props.expense,
)

// Reset expand when tab changes
const expanded = ref(false)
watch(activeTab, () => { expanded.value = false })

// ── Donut: top 6 + remainder ───────────────────────────────────
const TOP_N = 6

const topItems = computed(() => current.value.items.slice(0, TOP_N))
const restItems = computed(() => current.value.items.slice(TOP_N))
const hasRest = computed(() => restItems.value.length > 0)
const restAmount = computed(() =>
  restItems.value.reduce((s, c) => s + c.amount, 0),
)
const restPct = computed(() =>
  restItems.value.reduce((s, c) => s + c.percentage, 0),
)

// ── Chart data ─────────────────────────────────────────────────
const chartData = computed<ChartData<'doughnut'>>(() => {
  const items = topItems.value
  const data = [
    ...items.map((c) => c.amount),
    ...(hasRest.value ? [restAmount.value] : []),
  ]
  const colors = [
    ...items.map((c) => c.color),
    ...(hasRest.value ? ['#6b7280'] : []),
  ]
  const labels = [
    ...items.map((c) => c.name),
    ...(hasRest.value ? ['Lainnya'] : []),
  ]

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        hoverBackgroundColor: colors.map((c) => c + 'cc'),
        borderWidth: 0,
        hoverOffset: 8,
        borderRadius: 4,
        spacing: 2,
      },
    ],
  }
})

const chartOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: true,
  cutout: '70%',
  animation: {
    animateRotate: true,
    duration: 600,
    easing: 'easeInOutQuart',
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const allItems = [
            ...topItems.value,
            ...(hasRest.value
              ? [
                  {
                    name: 'Lainnya',
                    amount: restAmount.value,
                    percentage: restPct.value,
                    icon: '📦',
                  },
                ]
              : []),
          ]
          const item = allItems[ctx.dataIndex]
          if (!item) return ''
          return ` ${formatIDR(item.amount)}  (${item.percentage.toFixed(1)}%)`
        },
        title: (items) => {
          const allItems = [
            ...topItems.value,
            ...(hasRest.value ? [{ name: 'Lainnya', icon: '📦' }] : []),
          ]
          const item = items[0] ? allItems[items[0].dataIndex] : undefined
          if (!item) return ''
          return `${item.icon}  ${item.name}`
        },
      },
    },
  },
}))

// ── List: show 7 items, expand for rest ───────────────────────
const LIST_LIMIT = 7
const displayedItems = computed(() =>
  expanded.value
    ? current.value.items
    : current.value.items.slice(0, LIST_LIMIT),
)
const hasMore = computed(() => current.value.items.length > LIST_LIMIT)
const hiddenCount = computed(() =>
  current.value.items.length - LIST_LIMIT,
)

// ── Hovered item (for donut center) ───────────────────────────
const hoveredIndex = ref<number | null>(null)
</script>

<template>
  <!-- ── Skeleton ────────────────────────────────────────────── -->
  <div v-if="loading" class="card rounded-2xl p-4 animate-pulse space-y-4">
    <!-- Tab skeleton -->
    <div class="flex gap-2">
      <div class="h-8 flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      <div class="h-8 flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
    <!-- Donut + list skeleton -->
    <div class="flex gap-4">
      <div class="w-[130px] h-[130px] rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div class="flex-1 space-y-3 pt-1">
        <div v-for="i in 4" :key="i"
          class="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl"
          :style="{ opacity: 1 - i * 0.18 }"
        />
      </div>
    </div>
    <!-- List skeleton -->
    <div class="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
      <div v-for="i in 3" :key="i" class="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
    </div>
  </div>

  <!-- ── Main Card ───────────────────────────────────────────── -->
  <div v-else class="card rounded-2xl overflow-hidden animate-fade-in">

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="px-4 pt-4 pb-3">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Distribusi Kategori
          </h3>
          <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
            Total:
            <span class="font-semibold" :class="activeTab === 'income' ? 'text-emerald-500' : 'text-rose-500'">
              {{ formatCompact(current.total) }}
            </span>
            <template v-if="current.change !== null">
              <span
                class="ml-1.5 font-semibold"
                :class="
                  activeTab === 'income'
                    ? current.change >= 0 ? 'text-emerald-500' : 'text-rose-400'
                    : current.change <= 0 ? 'text-emerald-500' : 'text-rose-400'
                "
              >
                ({{ current.change >= 0 ? '+' : '' }}{{ current.change }}%)
              </span>
            </template>
          </p>
        </div>

        <!-- Transaction count badge -->
        <span class="
          text-[10px] font-semibold px-2 py-1 rounded-full
          bg-gray-100 dark:bg-gray-800
          text-gray-500 dark:text-gray-400
        ">
          {{ current.count }} transaksi
        </span>
      </div>
    </div>

    <!-- ── Tabs ─────────────────────────────────────────────── -->
    <div class="px-4 pb-4">
      <div class="flex p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl gap-1">
        <button
          v-for="tab in [
            { key: 'expense' as Tab, label: '💸 Pengeluaran' },
            { key: 'income'  as Tab, label: '💰 Pemasukan'   },
          ]"
          :key="tab.key"
          class="
            flex-1 py-2 px-3 rounded-[10px]
            text-xs font-semibold
            transition-all duration-200
            active:scale-95
          "
          :class="
            activeTab === tab.key
              ? tab.key === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-emerald-500 text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          "
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- ── Empty state ─────────────────────────────────────── -->
    <div
      v-if="!current.items.length"
      class="flex flex-col items-center justify-center py-12 text-center px-4"
    >
      <span class="text-4xl mb-3">📊</span>
      <p class="text-sm font-semibold text-gray-600 dark:text-gray-300">
        Belum ada data untuk periode ini
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Tambahkan transaksi untuk melihat distribusi kategori
      </p>
    </div>

    <!-- ── Donut + Top categories ──────────────────────────── -->
    <div v-else>
      <div class="px-4 pb-4 flex items-start gap-4">

        <!-- ── Doughnut chart ───────────────────────────────── -->
        <div class="relative flex-shrink-0 w-[130px] h-[130px]">
          <ClientOnly>
            <Doughnut
              :data="chartData"
              :options="chartOptions"
              class="w-full h-full"
            />
            <template #fallback>
              <div class="w-[130px] h-[130px] rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </template>
          </ClientOnly>

          <!-- Center label -->
          <div class="
            absolute inset-0
            flex flex-col items-center justify-center
            pointer-events-none
          ">
            <template v-if="hoveredIndex !== null && topItems[hoveredIndex]">
              <span class="text-xl leading-none mb-1">
                {{ topItems[hoveredIndex]?.icon }}
              </span>
              <span class="text-[11px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight max-w-[72px]">
                {{ formatCompact(topItems[hoveredIndex]?.amount || 0) }}
              </span>
              <span class="text-[9px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                {{ topItems[hoveredIndex]?.percentage.toFixed(1) }}%
              </span>
            </template>
            <template v-else>
              <span class="text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-none mb-1">
                Total
              </span>
              <span class="text-[12px] font-bold text-gray-800 dark:text-gray-100 text-center leading-tight px-1">
                {{ formatCompact(current.total) }}
              </span>
            </template>
          </div>
        </div>

        <!-- ── Top categories legend ────────────────────────── -->
        <div class="flex-1 flex flex-col gap-1 min-w-0">
          <button
            v-for="(cat, i) in topItems"
            :key="cat.categoryId"
            class="
              flex items-center gap-2 w-full text-left
              py-1.5 px-2 rounded-xl
              transition-all duration-150
              active:scale-95
            "
            :class="
              hoveredIndex === i
                ? 'bg-gray-100 dark:bg-gray-800'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            "
            @mouseenter="hoveredIndex = i"
            @mouseleave="hoveredIndex = null"
            @touchstart.passive="hoveredIndex = i"
            @touchend.passive="hoveredIndex = null"
          >
            <!-- Dot -->
            <span
              class="flex-shrink-0 w-2 h-2 rounded-full transition-transform duration-150"
              :class="hoveredIndex === i ? 'scale-125' : ''"
              :style="{ backgroundColor: cat.color }"
            />
            <!-- Icon + name -->
            <span class="text-[11px] font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">
              {{ cat.icon }} {{ cat.name }}
            </span>
            <!-- Pct -->
            <span class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex-shrink-0">
              {{ cat.percentage.toFixed(0) }}%
            </span>
          </button>

          <!-- "Lainnya" row -->
          <div
            v-if="hasRest"
            class="flex items-center gap-2 py-1.5 px-2"
          >
            <span class="flex-shrink-0 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
            <span class="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex-1 truncate">
              📦 Lainnya ({{ restItems.length }})
            </span>
            <span class="text-[11px] font-semibold text-gray-400 dark:text-gray-500 flex-shrink-0">
              {{ restPct.toFixed(0) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- ── Category list ─────────────────────────────────── -->
      <div class="border-t border-gray-100 dark:border-gray-800">
        <div
          v-for="(cat, idx) in displayedItems"
          :key="cat.categoryId"
          class="
            flex items-center gap-3 px-4 py-3
            transition-colors duration-150
            hover:bg-gray-50 dark:hover:bg-gray-800/30
          "
          :class="idx < displayedItems.length - 1
            ? 'border-b border-gray-50 dark:border-gray-800/60'
            : ''"
        >
          <!-- Icon bubble -->
          <div
            class="
              flex-shrink-0 w-9 h-9 rounded-xl
              flex items-center justify-center text-base
            "
            :style="{ backgroundColor: cat.color + '22' }"
          >
            {{ cat.icon }}
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {{ cat.name }}
              </span>
              <!-- Change badge -->
              <template v-if="cat.changePercent !== null">
                <span
                  class="
                    inline-flex items-center gap-0.5
                    text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
                  "
                  :class="
                    cat.changeIsPositive
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
                  "
                >
                  <TrendingUpIcon
                    v-if="cat.changeIsPositive"
                    :size="9"
                    :stroke-width="2.5"
                  />
                  <TrendingDownIcon
                    v-else
                    :size="9"
                    :stroke-width="2.5"
                  />
                  {{ cat.changePercent >= 0 ? '+' : '' }}{{ cat.changePercent }}%
                </span>
              </template>
            </div>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[11px] text-gray-400 dark:text-gray-500">
                {{ cat.transactionCount }} transaksi
              </span>
              <span class="text-[11px] text-gray-300 dark:text-gray-700">·</span>
              <span class="text-[11px] text-gray-400 dark:text-gray-500">
                rata-rata {{ formatCompact(cat.avgAmount) }}
              </span>
            </div>
          </div>

          <!-- Amount + pct -->
          <div class="flex flex-col items-end flex-shrink-0">
            <span
              class="text-sm font-bold"
              :class="activeTab === 'income' ? 'text-emerald-500' : 'text-rose-500'"
            >
              {{ formatCompact(cat.amount) }}
            </span>
            <span class="
              text-[10px] font-semibold mt-0.5
              px-1.5 py-0.5 rounded-full
              bg-gray-100 dark:bg-gray-800
              text-gray-500 dark:text-gray-400
            ">
              {{ cat.percentage.toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- ── Expand / Collapse button ──────────────────────── -->
      <div
        v-if="hasMore"
        class="border-t border-gray-100 dark:border-gray-800"
      >
        <button
          class="
            w-full flex items-center justify-center gap-1.5
            py-3 px-4
            text-xs font-semibold
            text-primary-600 dark:text-primary-400
            hover:bg-primary-50 dark:hover:bg-primary-950/20
            transition-all duration-150
            active:scale-98
          "
          @click="expanded = !expanded"
        >
          <template v-if="!expanded">
            <ChevronDownIcon :size="14" :stroke-width="2.5" />
            Lihat semua ({{ hiddenCount }} lagi)
          </template>
          <template v-else>
            <ChevronUpIcon :size="14" :stroke-width="2.5" />
            Sembunyikan
          </template>
        </button>
      </div>
    </div>

  </div>
</template>

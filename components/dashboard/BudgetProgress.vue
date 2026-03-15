<script setup lang="ts">
import { ChevronRightIcon, AlertCircleIcon, CheckCircle2Icon, TrendingUpIcon } from 'lucide-vue-next'

// ── Types ──────────────────────────────────────────────────────
interface Budget {
  id: string
  category: string
  icon: string
  color: string
  budgeted: number
  spent: number
  remaining: number
  percentage: number
}

// ── Props ──────────────────────────────────────────────────────
interface Props {
  budgets?: Budget[]
  period?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  budgets: () => [],
  period: '',
  loading: false,
})

// ── Composables ────────────────────────────────────────────────
const { formatIDR, formatCompact } = useCurrency()

// ── Color config based on percentage ──────────────────────────
interface ColorConfig {
  bar: string
  barGlow: string
  text: string
  bg: string
  badge: string
  icon: string
}

const getColorConfig = (pct: number): ColorConfig => {
  if (pct >= 100) {
    return {
      bar:     'bg-gradient-to-r from-rose-500 to-rose-600',
      barGlow: 'shadow-[0_0_8px_2px_rgba(244,63,94,0.4)]',
      text:    'text-rose-500 dark:text-rose-400',
      bg:      'bg-rose-50 dark:bg-rose-950/30',
      badge:   'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
      icon:    'text-rose-500',
    }
  }
  if (pct >= 85) {
    return {
      bar:     'bg-gradient-to-r from-amber-400 to-orange-500',
      barGlow: 'shadow-[0_0_8px_2px_rgba(251,146,60,0.35)]',
      text:    'text-amber-600 dark:text-amber-400',
      bg:      'bg-amber-50 dark:bg-amber-950/30',
      badge:   'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      icon:    'text-amber-500',
    }
  }
  if (pct >= 60) {
    return {
      bar:     'bg-gradient-to-r from-yellow-400 to-amber-400',
      barGlow: '',
      text:    'text-yellow-600 dark:text-yellow-400',
      bg:      'bg-yellow-50 dark:bg-yellow-950/30',
      badge:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
      icon:    'text-yellow-500',
    }
  }
  return {
    bar:     'bg-gradient-to-r from-emerald-400 to-teal-500',
    barGlow: '',
    text:    'text-emerald-600 dark:text-emerald-400',
    bg:      'bg-emerald-50 dark:bg-emerald-950/20',
    badge:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    icon:    'text-emerald-500',
  }
}

// ── Status label ───────────────────────────────────────────────
const getStatusLabel = (pct: number): string => {
  if (pct >= 100) return 'Melebihi batas'
  if (pct >= 85)  return 'Hampir habis'
  if (pct >= 60)  return 'Separuh lebih'
  return 'Aman'
}

// ── Clamp bar width 0–100% ─────────────────────────────────────
const barWidth = (pct: number): string => {
  return `${Math.min(Math.max(pct, 2), 100)}%`
}

// ── Total budget stats ─────────────────────────────────────────
const totalBudgeted = computed(() =>
  props.budgets.reduce((s, b) => s + b.budgeted, 0),
)
const totalSpent = computed(() =>
  props.budgets.reduce((s, b) => s + b.spent, 0),
)
const overallPct = computed(() =>
  totalBudgeted.value > 0
    ? Math.round((totalSpent.value / totalBudgeted.value) * 100)
    : 0,
)
const overBudgetCount = computed(() =>
  props.budgets.filter((b) => b.percentage >= 100).length,
)
const warningCount = computed(() =>
  props.budgets.filter((b) => b.percentage >= 85 && b.percentage < 100).length,
)

// ── Animate bars on mount ──────────────────────────────────────
const mounted = ref(false)
onMounted(() => {
  // Small delay so the CSS transition plays on first render
  setTimeout(() => {
    mounted.value = true
  }, 80)
})
</script>

<template>
  <!-- ── Skeleton ──────────────────────────────────────────────── -->
  <div v-if="loading" class="card rounded-2xl p-4 animate-pulse">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
    <!-- Summary bar -->
    <div class="h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4" />
    <!-- Items -->
    <div class="space-y-5">
      <div v-for="i in 4" :key="i" class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full" :style="{ width: `${80 + i * 12}px` }" />
          </div>
          <div class="h-3.5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <!-- Progress track -->
        <div class="h-2 bg-gray-100 dark:bg-gray-800 rounded-full" />
        <div class="flex justify-between">
          <div class="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded-full" />
          <div class="h-3 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
        </div>
      </div>
    </div>
  </div>

  <!-- ── Card ────────────────────────────────────────────────── -->
  <div
    v-else
    class="card rounded-2xl overflow-hidden animate-fade-in"
    style="animation-delay: 280ms;"
  >

    <!-- ── Header ────────────────────────────────────────────── -->
    <div class="flex items-center justify-between px-4 pt-4 pb-3">
      <div>
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Progress Budget
        </h3>
        <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          {{ period }}
        </p>
      </div>

      <NuxtLink
        to="/master-data"
        class="
          flex items-center gap-0.5
          text-xs font-semibold text-primary-500
          hover:text-primary-600
          transition-colors duration-150
          active:opacity-70
        "
      >
        Kelola
        <ChevronRightIcon :size="14" :stroke-width="2.5" />
      </NuxtLink>
    </div>

    <!-- ── Divider ─────────────────────────────────────────── -->
    <div class="divider" />

    <!-- ── Empty state ──────────────────────────────────────── -->
    <div
      v-if="!budgets.length"
      class="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <span class="text-4xl mb-3">🎯</span>
      <p class="text-sm font-semibold text-gray-600 dark:text-gray-300">
        Belum ada budget
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
        Buat budget di Master Data untuk mulai melacak pengeluaran
      </p>
      <NuxtLink
        to="/master-data"
        class="
          mt-4 px-4 py-2 rounded-xl text-xs font-semibold
          bg-primary-500 text-white
          hover:bg-primary-600 active:scale-95
          transition-all duration-150
        "
      >
        + Buat Budget
      </NuxtLink>
    </div>

    <!-- ── Content ──────────────────────────────────────────── -->
    <div v-else class="px-4 pt-3 pb-4 space-y-1">

      <!-- ── Overall summary chip ───────────────────────────── -->
      <div
        class="
          flex items-center justify-between
          rounded-2xl px-3.5 py-2.5 mb-4
        "
        :class="getColorConfig(overallPct).bg"
      >
        <!-- Left: icon + label -->
        <div class="flex items-center gap-2">
          <span :class="getColorConfig(overallPct).icon">
            <AlertCircleIcon v-if="overBudgetCount > 0" :size="18" :stroke-width="2" />
            <TrendingUpIcon   v-else-if="warningCount > 0" :size="18" :stroke-width="2" />
            <CheckCircle2Icon v-else :size="18" :stroke-width="2" />
          </span>
          <div>
            <p
              class="text-xs font-semibold leading-tight"
              :class="getColorConfig(overallPct).text"
            >
              <template v-if="overBudgetCount > 0">
                {{ overBudgetCount }} kategori melebihi budget!
              </template>
              <template v-else-if="warningCount > 0">
                {{ warningCount }} kategori hampir habis
              </template>
              <template v-else>
                Semua budget dalam batas aman
              </template>
            </p>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              Total dipakai {{ formatCompact(totalSpent) }} dari {{ formatCompact(totalBudgeted) }}
            </p>
          </div>
        </div>

        <!-- Right: overall percentage badge -->
        <span
          class="
            text-sm font-extrabold
            flex-shrink-0 ml-2
          "
          :class="getColorConfig(overallPct).text"
        >
          {{ overallPct }}%
        </span>
      </div>

      <!-- ── Budget items ──────────────────────────────────── -->
      <div class="space-y-4">
        <div
          v-for="(budget, index) in budgets"
          :key="budget.id"
          class="animate-slide-up"
          :style="{ animationDelay: `${index * 70 + 300}ms` }"
        >
          <!-- ── Top row: icon + name + badge ─────────────── -->
          <div class="flex items-center gap-2.5 mb-2">

            <!-- Category icon box -->
            <span
              class="
                flex items-center justify-center
                w-9 h-9 rounded-xl flex-shrink-0
                text-lg leading-none
              "
              :style="{ backgroundColor: `${budget.color}1a` }"
            >
              {{ budget.icon }}
            </span>

            <!-- Name + status -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {{ budget.category }}
                </span>
                <!-- Status badge -->
                <span
                  class="
                    text-[9px] font-bold uppercase tracking-wide
                    px-1.5 py-0.5 rounded-full
                    flex-shrink-0
                  "
                  :class="getColorConfig(budget.percentage).badge"
                >
                  {{ getStatusLabel(budget.percentage) }}
                </span>
              </div>
            </div>

            <!-- Percentage -->
            <span
              class="text-sm font-extrabold flex-shrink-0"
              :class="getColorConfig(budget.percentage).text"
            >
              {{ Math.round(budget.percentage) }}%
            </span>
          </div>

          <!-- ── Progress bar ────────────────────────────── -->
          <div class="progress-track mb-2">
            <div
              class="
                h-full rounded-full
                transition-all duration-700 ease-out
              "
              :class="[
                getColorConfig(budget.percentage).bar,
                budget.percentage >= 85 ? getColorConfig(budget.percentage).barGlow : '',
              ]"
              :style="{
                width: mounted ? barWidth(budget.percentage) : '2%',
              }"
            />
          </div>

          <!-- ── Bottom row: spent / budgeted / remaining ── -->
          <div class="flex items-center justify-between">
            <!-- Spent -->
            <div class="flex items-center gap-1">
              <span class="text-[10px] text-gray-400 dark:text-gray-500">Terpakai</span>
              <span
                class="text-[11px] font-bold"
                :class="getColorConfig(budget.percentage).text"
              >
                {{ formatCompact(budget.spent) }}
              </span>
            </div>

            <!-- Remaining / Over -->
            <div class="flex items-center gap-1">
              <template v-if="budget.remaining >= 0">
                <span class="text-[10px] text-gray-400 dark:text-gray-500">Sisa</span>
                <span class="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  {{ formatCompact(budget.remaining) }}
                </span>
              </template>
              <template v-else>
                <span class="text-[10px] text-rose-400">Lebih</span>
                <span class="text-[11px] font-bold text-rose-500 dark:text-rose-400">
                  {{ formatCompact(Math.abs(budget.remaining)) }}
                </span>
              </template>

              <!-- Total budget -->
              <span class="text-[10px] text-gray-300 dark:text-gray-600 mx-0.5">/</span>
              <span class="text-[10px] text-gray-400 dark:text-gray-500">
                {{ formatCompact(budget.budgeted) }}
              </span>
            </div>
          </div>

          <!-- ── Over-budget warning bar ─────────────────── -->
          <div
            v-if="budget.percentage >= 100"
            class="
              mt-2 flex items-center gap-1.5
              px-2.5 py-1.5 rounded-xl
              bg-rose-50 dark:bg-rose-950/30
              border border-rose-100 dark:border-rose-900/40
            "
          >
            <AlertCircleIcon
              :size="12"
              :stroke-width="2"
              class="text-rose-500 flex-shrink-0"
            />
            <p class="text-[10px] font-medium text-rose-600 dark:text-rose-400 leading-tight">
              Melebihi budget
              <span class="font-bold">
                {{ formatIDR(Math.abs(budget.remaining)) }}
              </span>
              — kurangi pengeluaran di kategori ini
            </p>
          </div>

          <!-- ── Separator ─────────────────────────────── -->
          <div
            v-if="index < budgets.length - 1"
            class="divider mt-4"
          />
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { TrendingUpIcon, TrendingDownIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-vue-next'

// ── Props ──────────────────────────────────────────────────────
interface Props {
  income?: number
  expense?: number
  incomeChange?: number
  expenseChange?: number
  incomeIsPositive?: boolean
  expenseIsPositive?: boolean
  period?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  income: 0,
  expense: 0,
  incomeChange: 0,
  expenseChange: 0,
  incomeIsPositive: true,
  expenseIsPositive: false,
  period: '',
  loading: false,
})

// ── Currency ────────────────────────────────────────────────────
const { formatCompact } = useCurrency()

// ── Computed change labels ─────────────────────────────────────
const incomeChangeLabel = computed(() => {
  const sign = props.incomeChange >= 0 ? '+' : ''
  return `${sign}${Math.abs(props.incomeChange).toFixed(1)}%`
})

const expenseChangeLabel = computed(() => {
  const sign = props.expenseChange >= 0 ? '+' : ''
  return `${sign}${Math.abs(props.expenseChange).toFixed(1)}%`
})

// ── Savings rate ───────────────────────────────────────────────
const savingsRate = computed(() => {
  if (!props.income || props.income === 0) return 0
  return Math.max(0, ((props.income - props.expense) / props.income) * 100)
})

const savingsAmount = computed(() => props.income - props.expense)
</script>

<template>
  <!-- ── Skeletons ──────────────────────────────────────────── -->
  <div v-if="loading" class="grid grid-cols-2 gap-3">
    <div
      v-for="i in 2"
      :key="i"
      class="card rounded-2xl p-4 animate-pulse space-y-3"
    >
      <div class="flex items-center justify-between">
        <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div class="h-7 w-7 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
      <div class="h-7 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  </div>

  <!-- ── Cards ─────────────────────────────────────────────── -->
  <div v-else class="space-y-3">
    <!-- Income + Expense row -->
    <div class="grid grid-cols-2 gap-3">

      <!-- ── Income Card ──────────────────────────────────── -->
      <div
        class="
          card rounded-2xl p-4 overflow-hidden relative
          border-l-4 border-emerald-400
          animate-fade-in
        "
      >
        <!-- Background decoration -->
        <div
          class="
            absolute -top-4 -right-4
            w-20 h-20 rounded-full
            bg-emerald-50 dark:bg-emerald-950/30
            pointer-events-none
          "
        />

        <!-- Header -->
        <div class="relative flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Pemasukan
          </span>
          <!-- Icon box -->
          <span
            class="
              flex items-center justify-center
              w-8 h-8 rounded-xl
              bg-emerald-100 dark:bg-emerald-950/50
              text-emerald-600 dark:text-emerald-400
            "
          >
            <ArrowDownIcon :size="16" :stroke-width="2.5" />
          </span>
        </div>

        <!-- Amount -->
        <p
          class="
            relative text-xl font-bold
            text-gray-900 dark:text-gray-50
            leading-tight mb-2
          "
        >
          {{ formatCompact(income) }}
        </p>

        <!-- Change indicator -->
        <div class="relative flex items-center gap-1">
          <span
            class="
              inline-flex items-center gap-0.5
              text-[11px] font-semibold
              px-1.5 py-0.5 rounded-full
            "
            :class="
              incomeIsPositive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
            "
          >
            <TrendingUpIcon v-if="incomeIsPositive" :size="10" :stroke-width="2.5" />
            <TrendingDownIcon v-else :size="10" :stroke-width="2.5" />
            {{ incomeChangeLabel }}
          </span>
          <span class="text-[10px] text-gray-400 dark:text-gray-500">
            vs lalu
          </span>
        </div>
      </div>

      <!-- ── Expense Card ──────────────────────────────────── -->
      <div
        class="
          card rounded-2xl p-4 overflow-hidden relative
          border-l-4 border-rose-400
          animate-fade-in
        "
        style="animation-delay: 80ms;"
      >
        <!-- Background decoration -->
        <div
          class="
            absolute -top-4 -right-4
            w-20 h-20 rounded-full
            bg-rose-50 dark:bg-rose-950/30
            pointer-events-none
          "
        />

        <!-- Header -->
        <div class="relative flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Pengeluaran
          </span>
          <!-- Icon box -->
          <span
            class="
              flex items-center justify-center
              w-8 h-8 rounded-xl
              bg-rose-100 dark:bg-rose-950/50
              text-rose-500 dark:text-rose-400
            "
          >
            <ArrowUpIcon :size="16" :stroke-width="2.5" />
          </span>
        </div>

        <!-- Amount -->
        <p
          class="
            relative text-xl font-bold
            text-gray-900 dark:text-gray-50
            leading-tight mb-2
          "
        >
          {{ formatCompact(expense) }}
        </p>

        <!-- Change indicator — for expense, down = good (green) -->
        <div class="relative flex items-center gap-1">
          <span
            class="
              inline-flex items-center gap-0.5
              text-[11px] font-semibold
              px-1.5 py-0.5 rounded-full
            "
            :class="
              !expenseIsPositive
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
            "
          >
            <TrendingDownIcon v-if="!expenseIsPositive" :size="10" :stroke-width="2.5" />
            <TrendingUpIcon v-else :size="10" :stroke-width="2.5" />
            {{ expenseChangeLabel }}
          </span>
          <span class="text-[10px] text-gray-400 dark:text-gray-500">
            vs lalu
          </span>
        </div>
      </div>
    </div>

    <!-- ── Savings Summary Bar ──────────────────────────────── -->
    <div
      class="card rounded-2xl px-4 py-3 animate-fade-in"
      style="animation-delay: 160ms;"
    >
      <div class="flex items-center justify-between mb-2">
        <!-- Label -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Tabungan Bulan Ini
          </span>
        </div>

        <!-- Savings amount + rate -->
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-bold"
            :class="
              savingsAmount >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-500 dark:text-rose-400'
            "
          >
            {{ formatCompact(Math.abs(savingsAmount)) }}
          </span>
          <span
            class="
              text-[11px] font-semibold
              px-2 py-0.5 rounded-full
            "
            :class="
              savingsRate >= 30
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                : savingsRate >= 10
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300'
            "
          >
            {{ savingsRate.toFixed(0) }}%
          </span>
        </div>
      </div>

      <!-- Progress bar: portion of income saved -->
      <div class="progress-track">
        <div
          class="h-full rounded-full transition-all duration-700 ease-out"
          :class="
            savingsRate >= 30
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
              : savingsRate >= 10
                ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                : 'bg-gradient-to-r from-rose-400 to-rose-500'
          "
          :style="{ width: `${Math.min(savingsRate, 100)}%` }"
        />
      </div>

      <!-- Sub-label -->
      <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">
        <template v-if="savingsRate >= 30">
          🎉 Luar biasa! Kamu menabung {{ savingsRate.toFixed(0) }}% dari pemasukan
        </template>
        <template v-else-if="savingsRate >= 10">
          👍 Bagus! Tingkatkan tabunganmu bulan depan
        </template>
        <template v-else-if="savingsAmount < 0">
          ⚠️ Pengeluaran melebihi pemasukan bulan ini
        </template>
        <template v-else>
          💡 Coba hemat lebih banyak untuk mencapai target tabungan
        </template>
      </p>
    </div>

  </div>
</template>

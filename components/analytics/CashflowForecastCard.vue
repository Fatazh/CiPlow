<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  CalendarIcon,
  FlameIcon,
  ShieldCheckIcon,
  SparklesIcon
} from 'lucide-vue-next'

const props = defineProps<{
  income?: number
  expense?: number
  currentBalance?: number
}>()

const { formatIDR, formatCompact } = useCurrency()

// ── Fetch active recurring transactions ─────────────────────────
const { data: recurringData } = useLazyFetch<any>('/api/recurring-transactions', {
  key: 'forecast-recurring'
})

const recurringList = computed(() => recurringData.value?.data || [])

// ── Date calculations ──────────────────────────────────────────
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() // 0-indexed
const currentDay = now.getDate()
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
const remainingDays = Math.max(0, daysInMonth - currentDay)

// Month progress percentage (0 - 100)
const monthProgressPct = Math.round((currentDay / daysInMonth) * 100)

// ── Financial Metrics ──────────────────────────────────────────
const currentExpense = computed(() => props.expense || 0)
const currentIncome = computed(() => props.income || 0)
const currentBalance = computed(() => props.currentBalance || 0)

// Daily Burn Rate
const dailyBurnRate = computed(() => {
  if (currentDay <= 0) return 0
  return Math.round(currentExpense.value / currentDay)
})

// Upcoming recurring expense in remainder of this month
const upcomingRecurringExpense = computed(() => {
  let total = 0
  for (const r of recurringList.value) {
    if (!r.isActive || r.type !== 'EXPENSE') continue
    const nextDate = new Date(r.nextRunDate)
    if (nextDate.getFullYear() === currentYear && nextDate.getMonth() === currentMonth && nextDate.getDate() > currentDay) {
      total += Number(r.amount) || 0
    }
  }
  return total
})

// Projected remaining variable expense (based on daily burn rate)
const projectedRemainingExpense = computed(() => {
  return dailyBurnRate.value * remainingDays
})

// Total projected expense at month end
const projectedTotalExpense = computed(() => {
  return currentExpense.value + projectedRemainingExpense.value + upcomingRecurringExpense.value
})

// Projected end of month balance
const projectedEndBalance = computed(() => {
  const futureOutflow = projectedRemainingExpense.value + upcomingRecurringExpense.value
  return currentBalance.value - futureOutflow
})

// Safe daily spending limit
const safeDailyLimit = computed(() => {
  if (remainingDays <= 0) return 0
  const availableToSpend = Math.max(0, currentBalance.value - upcomingRecurringExpense.value)
  return Math.round(availableToSpend / remainingDays)
})

// Financial Health Status
type ForecastStatus = 'SAFE' | 'WARNING' | 'DANGER'

const forecastStatus = computed<ForecastStatus>(() => {
  if (projectedEndBalance.value < 0) return 'DANGER'
  if (projectedEndBalance.value < currentBalance.value * 0.25 || safeDailyLimit.value < dailyBurnRate.value * 0.7) return 'WARNING'
  return 'SAFE'
})

const statusConfig = computed(() => {
  switch (forecastStatus.value) {
    case 'DANGER':
      return {
        label: 'Potensi Defisit',
        badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
        cardBorder: 'border-rose-200 dark:border-rose-900/50',
        advice: 'Pengeluaran harian Anda melebihi saldo tersedia. Disarankan membatasi belanja non-pokok hingga akhir bulan.',
        color: 'rose'
      }
    case 'WARNING':
      return {
        label: 'Kondisi Waspada',
        badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
        cardBorder: 'border-amber-200 dark:border-amber-900/50',
        advice: 'Saldo akhir bulan Anda diperkirakan cukup tipis. Jaga pengeluaran harian di bawah batas aman.',
        color: 'amber'
      }
    default:
      return {
        label: 'Arus Kas Aman (Surplus)',
        badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
        cardBorder: 'border-emerald-200 dark:border-emerald-900/50',
        advice: 'Pola pengeluaran Anda terkendali dengan baik. Anda berada di jalur aman menuju akhir bulan!',
        color: 'emerald'
      }
  }
})
</script>

<template>
  <div class="card rounded-3xl p-5 border bg-white dark:bg-surface-900 shadow-sm transition-all duration-300 space-y-4" :class="statusConfig.cardBorder">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500/20 to-primary-600/10 flex items-center justify-center text-xl shadow-xs">
          🔮
        </div>
        <div>
          <h3 class="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
            Proyeksi Arus Kas Akhir Bulan
          </h3>
          <p class="text-[11px] text-gray-400">
            Prediksi saldo & batas aman belanja harian
          </p>
        </div>
      </div>

      <!-- Health Badge -->
      <span class="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs" :class="statusConfig.badgeClass">
        {{ statusConfig.label }}
      </span>
    </div>

    <!-- Month Progress Tracker -->
    <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-surface-800/60 border border-gray-100 dark:border-gray-800 space-y-2">
      <div class="flex items-center justify-between text-xs font-bold">
        <span class="text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <CalendarIcon :size="13" />
          Hari ke-{{ currentDay }} dari {{ daysInMonth }} hari
        </span>
        <span class="text-primary-600 dark:text-primary-400">
          Sisa {{ remainingDays }} Hari
        </span>
      </div>

      <div class="w-full h-2.5 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
        <div
          class="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
          :style="{ width: `${monthProgressPct}%` }"
        />
      </div>
    </div>

    <!-- 2 Main Projection Cards -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Card 1: Daily Burn Rate -->
      <div class="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-surface-800/40 border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
        <div class="flex items-center gap-1.5 mb-1.5">
          <FlameIcon :size="14" class="text-orange-500" />
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Rata-rata Keluar / Hari
          </span>
        </div>
        <div class="text-base font-black text-gray-800 dark:text-gray-100">
          {{ formatIDR(dailyBurnRate) }}
        </div>
        <p class="text-[10px] text-gray-400 mt-1">
          Burn rate {{ currentDay }} hari aktif
        </p>
      </div>

      <!-- Card 2: Safe Daily Limit -->
      <div class="p-3.5 rounded-2xl bg-primary-50/30 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/40 flex flex-col justify-between">
        <div class="flex items-center gap-1.5 mb-1.5">
          <ShieldCheckIcon :size="14" class="text-primary-500" />
          <span class="text-[10px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">
            Batas Aman / Hari
          </span>
        </div>
        <div class="text-base font-black text-primary-600 dark:text-primary-400">
          {{ formatIDR(safeDailyLimit) }}
        </div>
        <p class="text-[10px] text-gray-400 mt-1">
          Maksimal belanja sisa hari
        </p>
      </div>
    </div>

    <!-- Projected Balance Summary Strip -->
    <div class="p-3.5 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-surface-800/70 dark:to-surface-800/30 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
      <div>
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
          Estimasi Saldo di Akhir Bulan
        </span>
        <span
          class="text-base font-black"
          :class="projectedEndBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
        >
          {{ formatIDR(projectedEndBalance) }}
        </span>
      </div>

      <div class="text-right text-[11px]">
        <div class="text-gray-400 font-semibold">
          Tagihan Berulang:
        </div>
        <div class="font-bold text-gray-700 dark:text-gray-200">
          {{ upcomingRecurringExpense > 0 ? formatIDR(upcomingRecurringExpense) : 'Rp 0' }}
        </div>
      </div>
    </div>

    <!-- Smart Advice Note -->
    <div class="p-3 rounded-2xl bg-gray-50 dark:bg-surface-800/40 text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2.5">
      <span class="text-base flex-shrink-0">💡</span>
      <p class="text-[11px] leading-relaxed">
        {{ statusConfig.advice }}
      </p>
    </div>
  </div>
</template>

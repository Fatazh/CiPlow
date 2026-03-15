<script setup lang="ts">
// pages/index.vue — Dashboard

// ── Page meta ─────────────────────────────────────────────────
useHead({
  title: 'Beranda — PPLow',
})

// ── Fetch dashboard summary ────────────────────────────────────
const {
  data: summaryData,
  status,
  error,
  refresh,
} = await useFetch('/api/dashboard/summary', {
  key: 'dashboard-summary',
  lazy: false,
})

const isLoading = computed(() => status.value === 'pending')

// ── Typed shortcuts to nested data ────────────────────────────
const balance = computed(() => summaryData.value?.data?.balance)
const monthly  = computed(() => summaryData.value?.data?.monthly)
const categories = computed(() => summaryData.value?.data?.categories ?? [])
const recentTransactions = computed(() => summaryData.value?.data?.recentTransactions ?? [])
const budgets  = computed(() => summaryData.value?.data?.budgets ?? [])

// ── Pull-to-refresh (via button on mobile) ─────────────────────
const isRefreshing = ref(false)

const handleRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  await refresh()
  isRefreshing.value = false
}

// ── Current period label ───────────────────────────────────────
const { currentMonthYear } = useDate()
const period = computed(() => monthly.value?.period ?? currentMonthYear())
</script>

<template>
  <div class="space-y-4 animate-fade-in">

    <!-- ── Error state ──────────────────────────────────────── -->
    <div
      v-if="error && !isLoading"
      class="
        card rounded-2xl p-6
        flex flex-col items-center justify-center
        text-center gap-3
      "
    >
      <span class="text-4xl">😵</span>
      <div>
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Gagal memuat data
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {{ error?.message ?? 'Terjadi kesalahan, coba lagi.' }}
        </p>
      </div>
      <button
        class="btn-primary text-sm py-2 px-5"
        @click="handleRefresh"
      >
        🔄 Coba Lagi
      </button>
    </div>

    <!-- ── Main dashboard content ────────────────────────────── -->
    <template v-else>

      <!-- ── 1. Balance Card ─────────────────────────────────── -->
      <section>
        <BalanceCard
          :total="balance?.total"
          :last-month="balance?.lastMonth"
          :change-percent="balance?.changePercent"
          :is-positive="balance?.isPositive"
          :period="period"
          :wallets="balance?.wallets ?? []"
          :loading="isLoading"
        />
      </section>

      <!-- ── 2. Income / Expense Summary ────────────────────── -->
      <section>
        <SummaryCards
          :income="monthly?.income"
          :expense="monthly?.expense"
          :income-change="monthly?.incomeChange"
          :expense-change="monthly?.expenseChange"
          :income-is-positive="monthly?.incomeIsPositive"
          :expense-is-positive="monthly?.expenseIsPositive"
          :period="period"
          :loading="isLoading"
        />
      </section>

      <!-- ── 3. Category Donut Chart ─────────────────────────── -->
      <section>
        <CategoryDonut
          :categories="categories"
          :total-expense="monthly?.expense"
          :period="period"
          :loading="isLoading"
        />
      </section>

      <!-- ── 4. Recent Transactions ─────────────────────────── -->
      <section>
        <RecentTransactions
          :transactions="recentTransactions"
          :loading="isLoading"
        />
      </section>

      <!-- ── 5. Budget Progress ──────────────────────────────── -->
      <section>
        <BudgetProgress
          :budgets="budgets"
          :period="period"
          :loading="isLoading"
        />
      </section>

      <!-- ── Refresh indicator + button ─────────────────────── -->
      <div class="flex flex-col items-center gap-2 pb-2">
        <!-- Mock data notice -->
        <div
          v-if="summaryData?.isMockData"
          class="
            flex items-center gap-2
            px-3 py-1.5 rounded-full
            bg-amber-50 dark:bg-amber-950/30
            border border-amber-100 dark:border-amber-900/40
          "
        >
          <span class="text-xs">🧪</span>
          <span class="text-[11px] font-medium text-amber-700 dark:text-amber-400">
            Data demo — hubungkan database untuk data nyata
          </span>
        </div>

        <!-- Refresh button -->
        <button
          class="
            flex items-center gap-1.5
            text-xs font-medium
            text-gray-400 dark:text-gray-500
            hover:text-primary-500 dark:hover:text-primary-400
            transition-colors duration-150
            active:scale-95
            py-1 px-3
          "
          :disabled="isRefreshing"
          @click="handleRefresh"
        >
          <svg
            class="w-3.5 h-3.5 transition-transform duration-500"
            :class="isRefreshing ? 'animate-spin' : ''"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          <span>{{ isRefreshing ? 'Memperbarui...' : 'Perbarui data' }}</span>
        </button>
      </div>

    </template>
  </div>
</template>

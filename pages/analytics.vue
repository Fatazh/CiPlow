<script setup lang="ts">
useHead({ title: "Analitik — CashPlow" });

// ── Composables ────────────────────────────────────────────────
const { formatCompact } = useCurrency();

// ── Period state (default = current month) ─────────────────────
const now = new Date();
const period = ref({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
});

// ── API: 6-month trends (static, no period dependency) ─────────
const {
    data: trendsRaw,
    pending: trendLoading,
    error: trendError,
} = useLazyFetch("/api/analytics/trends", {
    key: "analytics-trends",
});

// ── API: category breakdown (reactive function URL → auto-refetch on period change) ──
const {
    data: catRaw,
    pending: catLoading,
    error: catError,
} = useLazyFetch(
    () =>
        `/api/analytics/categories?month=${period.value.month}&year=${period.value.year}`,
);

// ── API: Smart Insights ───────────────────────────────────────
const { data: smartRaw, pending: smartLoading } = useLazyFetch(
    () => `/api/analytics/smart-insights`,
    { key: "smart-insights" },
);

// ── Typed accessors ────────────────────────────────────────────
const trendData = computed(() => trendsRaw.value?.data ?? null);
const catData = computed(() => catRaw.value?.data ?? null);
const smartInsights = computed(() => (smartRaw.value?.data ?? []) as any);

// ── Period selector: available months from API ─────────────────
const availableMonths = computed(() => catData.value?.availableMonths ?? []);

// ── Top expense (for InsightsCard) ─────────────────────────────
const topExpense = computed(() => {
    const items = catData.value?.expense?.items;
    if (!items?.length) return null;
    const top = items[0];
    return {
        name: top.name,
        icon: top.icon,
        amount: top.amount,
        percentage: top.percentage,
        changePercent: top.changePercent ?? null,
        changeIsPositive: top.changeIsPositive ?? true,
    };
});

// ── Quick stats strip (6-month averages from trends) ──────────
interface QuickStat {
    label: string;
    display: string;
    colorClass: string;
    dotClass: string;
}

const quickStats = computed<QuickStat[]>(() => {
    const s = trendData.value?.summary;
    if (!s) return [];

    const rateColor =
        s.overallSavingsRate >= 20
            ? "emerald"
            : s.overallSavingsRate >= 10
              ? "amber"
              : "rose";

    return [
        {
            label: "Avg Masuk",
            display: formatCompact(s.avgIncome),
            colorClass: "text-emerald-500",
            dotClass: "bg-emerald-500",
        },
        {
            label: "Avg Keluar",
            display: formatCompact(s.avgExpense),
            colorClass: "text-rose-500",
            dotClass: "bg-rose-500",
        },
        {
            label: "Saving Rate",
            display: `${s.overallSavingsRate}%`,
            colorClass: `text-${rateColor}-500`,
            dotClass: `bg-${rateColor}-500`,
        },
    ];
});

// ── Fallback empty data (avoids undefined prop errors) ─────────
const fallbackIncome = {
    total: 0,
    prevTotal: 0,
    change: null,
    items: [],
    count: 0,
};
const fallbackExpense = {
    total: 0,
    prevTotal: 0,
    change: null,
    items: [],
    count: 0,
};
const fallbackSummary = {
    savings: 0,
    savingsRate: 0,
    prevSavings: 0,
    prevSavingsRate: 0,
    transactionCount: 0,
};
</script>

<template>
    <div class="space-y-4 animate-fade-in">
        <!-- ── Page Title ────────────────────────────────────────── -->
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Analitik
                </h2>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Laporan keuangan lengkap
                </p>
            </div>

            <!-- Error indicator -->
            <Transition
                enter-active-class="transition-all duration-300"
                enter-from-class="opacity-0 scale-90"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition-all duration-200"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-90"
            >
                <div
                    v-if="trendError || catError"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400"
                >
                    <span
                        class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                    />
                    Gagal memuat
                </div>
            </Transition>
        </div>

        <!-- ── Period Selector ───────────────────────────────────── -->
        <PeriodSelector v-model="period" :available-months="availableMonths" />

        <!-- ── Quick Stats strip ──────────────────────────────────── -->
        <!-- Skeleton -->
        <div v-if="trendLoading && !trendData" class="grid grid-cols-3 gap-2">
            <div
                v-for="i in 3"
                :key="i"
                class="card rounded-2xl p-3 animate-pulse space-y-2"
            >
                <div
                    class="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full"
                />
                <div
                    class="h-5 w-3/4 bg-gray-100 dark:bg-gray-800 rounded-full"
                />
                <div
                    class="h-2 w-1/2 bg-gray-100 dark:bg-gray-800 rounded-full"
                />
            </div>
        </div>

        <!-- Data -->
        <div v-else-if="quickStats.length" class="grid grid-cols-3 gap-2">
            <div
                v-for="stat in quickStats"
                :key="stat.label"
                class="card rounded-2xl p-3 flex flex-col gap-1 animate-fade-in"
            >
                <div class="flex items-center gap-1.5">
                    <span
                        class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        :class="stat.dotClass"
                    />
                    <span
                        class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 truncate leading-none"
                    >
                        {{ stat.label }}
                    </span>
                </div>
                <span
                    class="text-sm font-bold leading-none"
                    :class="stat.colorClass"
                >
                    {{ stat.display }}
                </span>
                <span
                    class="text-[9px] text-gray-400 dark:text-gray-500 font-medium"
                >
                    6 bln terakhir
                </span>
            </div>
        </div>

        <!-- ── Trend Chart (6-month, no period dependency) ───────── -->
        <TrendChart
            :months="trendData?.months ?? []"
            :loading="trendLoading && !trendData"
        />

        <!-- ── Weekly Trend Chart (Current Month) ───────────────── -->
        <WeeklyTrendChart
            :weeks="catData?.weeklyTrends ?? []"
            :loading="catLoading && !catData"
        />

        <!-- ── Monthly Comparison ───────────────────────────────── -->
        <MonthlyComparison
            :income="catData?.income ?? fallbackIncome"
            :expense="catData?.expense ?? fallbackExpense"
            :summary="catData?.summary ?? fallbackSummary"
            :period-label="catData?.period?.label ?? '—'"
            :loading="catLoading && !catData"
        />

        <!-- ── Category Breakdown (tabs: pengeluaran / pemasukan) ── -->
        <CategoryBreakdown
            :income="catData?.income ?? fallbackIncome"
            :expense="catData?.expense ?? fallbackExpense"
            :loading="catLoading && !catData"
        />

        <!-- ── Insights Card ─────────────────────────────────────── -->
        <InsightsCard
            :trend-summary="trendData?.summary ?? null"
            :top-expense="topExpense"
            :current-savings-rate="catData?.summary?.savingsRate ?? 0"
            :current-savings="catData?.summary?.savings ?? 0"
            :smart-insights="smartInsights"
            :loading="
                (trendLoading && !trendData) ||
                (catLoading && !catData) ||
                smartLoading
            "
        />

        <!-- Bottom spacer for nav bar -->
        <div class="h-2" />
    </div>
</template>

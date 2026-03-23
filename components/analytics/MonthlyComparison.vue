<script setup lang="ts">
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-vue-next";

// ── Types ──────────────────────────────────────────────────────
interface Props {
    income: {
        total: number;
        prevTotal: number;
        change: number | null;
    };
    expense: {
        total: number;
        prevTotal: number;
        change: number | null;
    };
    summary: {
        savings: number;
        savingsRate: number;
        prevSavings: number;
        prevSavingsRate: number;
        transactionCount: number;
    };
    periodLabel: string;
    loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
});

// ── Composables ────────────────────────────────────────────────
const { formatCompact } = useCurrency();

// ── Helpers ────────────────────────────────────────────────────
const prevLabel = computed(() => {
    // e.g. "Maret 2026" → derive nothing, just say "Bulan lalu"
    return "Bln lalu";
});

interface RowDef {
    key: string;
    icon: string;
    label: string;
    current: number;
    prev: number;
    change: number | null;
    /** true  = higher is better (income, savings)
     *  false = lower is better (expense) */
    higherIsBetter: boolean;
    currentColor: string;
    badgeBase: string;
    subLabel?: string;
}

const rows = computed<RowDef[]>(() => [
    {
        key: "income",
        icon: "💰",
        label: "Pemasukan",
        current: props.income.total,
        prev: props.income.prevTotal,
        change: props.income.change,
        higherIsBetter: true,
        currentColor: "text-emerald-500",
        badgeBase: "emerald",
        subLabel: undefined,
    },
    {
        key: "expense",
        icon: "💸",
        label: "Pengeluaran",
        current: props.expense.total,
        prev: props.expense.prevTotal,
        change: props.expense.change,
        higherIsBetter: false,
        currentColor: "text-rose-500",
        badgeBase: "rose",
        subLabel: undefined,
    },
    {
        key: "savings",
        icon: "🏦",
        label: "Tabungan",
        current: props.summary.savings,
        prev: props.summary.prevSavings,
        change:
            props.summary.prevSavings !== 0
                ? Math.round(
                      ((props.summary.savings - props.summary.prevSavings) /
                          Math.abs(props.summary.prevSavings)) *
                          1000,
                  ) / 10
                : null,
        higherIsBetter: true,
        currentColor:
            props.summary.savings >= 0 ? "text-cyan-500" : "text-rose-500",
        badgeBase: "cyan",
        subLabel: `${props.summary.savingsRate}% dari pemasukan`,
    },
]);

// ── Change badge logic ─────────────────────────────────────────
function isChangePositive(row: RowDef): boolean {
    if (row.change === null) return true;
    return row.higherIsBetter ? row.change >= 0 : row.change <= 0;
}

function changeBadgeClass(row: RowDef): string {
    if (row.change === null)
        return "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500";
    const positive = isChangePositive(row);
    return positive
        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
        : "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400";
}

function changeLabel(change: number | null): string {
    if (change === null) return "—";
    return `${change >= 0 ? "+" : ""}${change}%`;
}
</script>

<template>
    <!-- ── Skeleton ────────────────────────────────────────────── -->
    <div v-if="loading" class="card rounded-2xl p-4 animate-pulse space-y-4">
        <div class="space-y-1">
            <div class="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div class="h-3 w-56 bg-gray-100 dark:bg-gray-800 rounded-full" />
        </div>
        <!-- Column headers -->
        <div class="flex justify-end gap-4 pr-1">
            <div class="h-3 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
            <div class="h-3 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
        </div>
        <!-- Rows -->
        <div
            v-for="i in 3"
            :key="i"
            class="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl"
            :style="{ opacity: 1 - i * 0.15 }"
        />
        <!-- Footer -->
        <div
            class="h-4 w-36 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto"
        />
    </div>

    <!-- ── Card ───────────────────────────────────────────────── -->
    <div v-else class="card rounded-2xl p-4 animate-fade-in">
        <!-- ── Header ──────────────────────────────────────────── -->
        <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Perbandingan Bulan
            </h3>
            <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {{ periodLabel }} vs bulan sebelumnya
            </p>
        </div>

        <!-- ── Column headers ───────────────────────────────────── -->
        <div class="flex items-center mb-2 px-1">
            <!-- Left spacer (icon + label) -->
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <div class="w-8 flex-shrink-0" />
                <div class="w-16" />
            </div>
            <!-- Column labels -->
            <div class="flex items-center gap-3 flex-shrink-0">
                <span
                    class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-16 text-right"
                >
                    Bln ini
                </span>
                <span class="w-14" /><!-- change badge spacer -->
                <span
                    class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide w-16 text-right"
                >
                    {{ prevLabel }}
                </span>
            </div>
        </div>

        <!-- ── Rows ─────────────────────────────────────────────── -->
        <div class="space-y-0">
            <div
                v-for="(row, idx) in rows"
                :key="row.key"
                class="flex items-center gap-2.5 py-3 px-1"
                :class="
                    idx < rows.length - 1
                        ? 'border-b border-gray-100 dark:border-gray-800/80'
                        : ''
                "
            >
                <!-- Icon bubble -->
                <div
                    class="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm bg-gray-100 dark:bg-gray-800/70"
                >
                    {{ row.icon }}
                </div>

                <!-- Label + sub -->
                <div class="flex-1 min-w-0">
                    <p
                        class="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none"
                    >
                        {{ row.label }}
                    </p>
                    <p
                        v-if="row.subLabel"
                        class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none"
                    >
                        {{ row.subLabel }}
                    </p>
                </div>

                <!-- Current amount -->
                <div class="flex-shrink-0 w-16 text-right">
                    <span class="text-sm font-bold" :class="row.currentColor">
                        {{ formatCompact(row.current) }}
                    </span>
                </div>

                <!-- Change badge -->
                <div class="flex-shrink-0 w-14 flex justify-center">
                    <span
                        class="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-1 rounded-full"
                        :class="changeBadgeClass(row)"
                    >
                        <!-- Icon -->
                        <template v-if="row.change === null">
                            <MinusIcon :size="9" :stroke-width="2.5" />
                        </template>
                        <template v-else-if="isChangePositive(row)">
                            <TrendingUpIcon :size="9" :stroke-width="2.5" />
                        </template>
                        <template v-else>
                            <TrendingDownIcon :size="9" :stroke-width="2.5" />
                        </template>
                        {{ changeLabel(row.change) }}
                    </span>
                </div>

                <!-- Prev amount -->
                <div class="flex-shrink-0 w-16 text-right">
                    <span
                        class="text-sm font-medium text-gray-400 dark:text-gray-500"
                    >
                        {{ formatCompact(row.prev) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- ── Footer: transaction count ────────────────────────── -->
        <div
            class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-center gap-1.5"
        >
            <span class="text-base leading-none">🧾</span>
            <span
                class="text-[11px] font-semibold text-gray-400 dark:text-gray-500"
            >
                {{ summary.transactionCount }} transaksi bulan ini
            </span>
        </div>
    </div>
</template>

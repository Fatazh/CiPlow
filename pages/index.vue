<script setup lang="ts">
// pages/index.vue — Dashboard

// ── Page meta ─────────────────────────────────────────────────
useHead({
    title: "Beranda — CashPlow",
});

// ── Fetch dashboard summary ────────────────────────────────────
const {
    data: summaryData,
    status,
    error,
    refresh,
} = await useFetch("/api/dashboard/summary", {
    key: "dashboard-summary",
    lazy: false,
});

const isLoading = computed(() => status.value === "pending");

// ── Typed shortcuts to nested data ────────────────────────────
const balance = computed(() => summaryData.value?.data?.balance);
const monthly = computed(() => summaryData.value?.data?.monthly);
const categories = computed(() => summaryData.value?.data?.categories ?? []);
const recentTransactions = computed(
    () => summaryData.value?.data?.recentTransactions ?? [],
);
const budgets = computed(() => summaryData.value?.data?.budgets ?? []);

// ── Fetch savings goals & wallets ─────────────────────────────
const { data: savingsData, refresh: refreshSavings } = await useFetch("/api/savings-goals", {
    key: "dashboard-savings",
    lazy: false,
});
const { data: walletsData } = await useFetch("/api/wallets", {
    key: "dashboard-wallets",
});

const savingsGoals = computed<any[]>(() => (savingsData.value as any)?.data ?? []);
const wallets = computed<any[]>(() => (walletsData.value as any)?.data ?? []);

// Modals
const showGoalModal = ref(false);
const selectedGoalForEdit = ref<any>(null);
const showDepositModal = ref(false);
const selectedGoalForDeposit = ref<any>(null);

const handleOpenNewGoal = () => {
    selectedGoalForEdit.value = null;
    showGoalModal.value = true;
};

const handleEditGoal = (goal: any) => {
    selectedGoalForEdit.value = goal;
    showGoalModal.value = true;
};

const handleDepositGoal = (goal: any) => {
    selectedGoalForDeposit.value = goal;
    showDepositModal.value = true;
};

const handleDeleteGoal = async (goal: any) => {
    if (confirm(`Apakah Anda yakin ingin menghapus target tabungan "${goal.name}"?`)) {
        await $fetch(`/api/savings-goals/${goal.id}`, { method: 'DELETE' });
        await refreshSavings();
        await refresh();
    }
};

const handleSavedGoal = async () => {
    await refreshSavings();
};

const handleDepositSuccess = async (msg: string) => {
    await refreshSavings();
    await refresh();
};

// ── Pull-to-refresh (via button on mobile) ─────────────────────
const isRefreshing = ref(false);

const handleRefresh = async () => {
    if (isRefreshing.value) return;
    isRefreshing.value = true;
    await Promise.all([refresh(), refreshSavings()]);
    isRefreshing.value = false;
};

// ── Current period label ───────────────────────────────────────
const { currentMonthYear } = useDate();
const period = computed(() => monthly.value?.period ?? currentMonthYear());
</script>

<template>
    <div class="space-y-4 animate-fade-in">
        <!-- ── Error state ──────────────────────────────────────── -->
        <div
            v-if="error && !isLoading"
            class="card rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3"
        >
            <span class="text-4xl">😵</span>
            <div>
                <p
                    class="text-sm font-semibold text-gray-700 dark:text-gray-200"
                >
                    Gagal memuat data
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {{ error?.message ?? "Terjadi kesalahan, coba lagi." }}
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

            <!-- ── Quick Feature Shortcuts ───────────────────────────── -->
            <section class="grid grid-cols-4 gap-2">
                <NuxtLink
                    to="/debts"
                    class="card rounded-2xl p-2.5 flex flex-col items-center justify-center text-center gap-1 hover:border-primary-500/40 transition-all active:scale-95 group"
                >
                    <span class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                        🤝
                    </span>
                    <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        Hutang
                    </span>
                </NuxtLink>

                <button
                    @click="handleOpenNewGoal"
                    class="card rounded-2xl p-2.5 flex flex-col items-center justify-center text-center gap-1 hover:border-primary-500/40 transition-all active:scale-95 group"
                >
                    <span class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                        🎯
                    </span>
                    <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        Tabungan
                    </span>
                </button>

                <NuxtLink
                    to="/profile/export"
                    class="card rounded-2xl p-2.5 flex flex-col items-center justify-center text-center gap-1 hover:border-primary-500/40 transition-all active:scale-95 group"
                >
                    <span class="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                        📄
                    </span>
                    <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        Ekspor PDF
                    </span>
                </NuxtLink>

                <NuxtLink
                    to="/add-transaction"
                    class="card rounded-2xl p-2.5 flex flex-col items-center justify-center text-center gap-1 hover:border-primary-500/40 transition-all active:scale-95 group"
                >
                    <span class="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                        📷
                    </span>
                    <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                        Scan AI
                    </span>
                </NuxtLink>
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

            <!-- ── 5. Target Tabungan (Savings Goals) ──────────────── -->
            <section class="space-y-3">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                            <span>🎯</span>
                            <span>Target Tabungan</span>
                        </h3>
                        <p class="text-[11px] text-gray-400">Pantau progres capaian impian Anda</p>
                    </div>
                    <button
                        @click="handleOpenNewGoal"
                        class="px-2.5 py-1 rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/50 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                    >
                        <span>➕</span>
                        <span>Target Baru</span>
                    </button>
                </div>

                <!-- Empty state for goals -->
                <div
                    v-if="savingsGoals.length === 0"
                    class="card rounded-2xl p-5 text-center space-y-2 border border-dashed border-gray-200 dark:border-gray-800"
                >
                    <span class="text-3xl">✨</span>
                    <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">Belum ada target tabungan</p>
                    <p class="text-[10px] text-gray-400 max-w-xs mx-auto">
                        Mulai rencanakan dana darurat, liburan, atau barang impian Anda hari ini!
                    </p>
                    <button
                        @click="handleOpenNewGoal"
                        class="btn-primary text-xs py-1.5 px-4 mx-auto"
                    >
                        🚀 Buat Target Sekarang
                    </button>
                </div>

                <!-- Goals list -->
                <div v-else class="space-y-3">
                    <SavingsGoalCard
                        v-for="goal in savingsGoals"
                        :key="goal.id"
                        :goal="goal"
                        @deposit="handleDepositGoal"
                        @edit="handleEditGoal"
                        @delete="handleDeleteGoal"
                    />
                </div>
            </section>

            <!-- ── 6. Budget Progress ──────────────────────────────── -->
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
                    class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40"
                >
                    <span class="text-xs">🧪</span>
                    <span
                        class="text-[11px] font-medium text-amber-700 dark:text-amber-400"
                    >
                        Data demo — hubungkan database untuk data nyata
                    </span>
                </div>

                <!-- Refresh button -->
                <button
                    class="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-150 active:scale-95 py-1 px-3"
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
                        <path
                            d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
                        />
                        <path d="M21 3v5h-5" />
                    </svg>
                    <span>{{
                        isRefreshing ? "Memperbarui..." : "Perbarui data"
                    }}</span>
                </button>
            </div>
        </template>

        <!-- Modals -->
        <SavingsGoalModal
            :show="showGoalModal"
            :goal="selectedGoalForEdit"
            @close="showGoalModal = false"
            @saved="handleSavedGoal"
        />

        <SavingsDepositModal
            :show="showDepositModal"
            :goal="selectedGoalForDeposit"
            :wallets="wallets"
            @close="showDepositModal = false"
            @success="handleDepositSuccess"
        />
    </div>
</template>

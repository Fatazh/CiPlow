<script setup lang="ts">
// pages/transactions.vue — Transaction History with filters

useHead({ title: "Riwayat Transaksi — CashPlow" });

const { formatIDR } = useCurrency();
const { formatSmart, groupByDate } = useDate();

// ── Filters ─────────────────────────────────────────────────
const now = new Date();
const filter = reactive({
    type: "" as "" | "INCOME" | "EXPENSE" | "TRANSFER",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    search: "",
    categoryId: "",
    walletId: "",
});

// ── Master Data for Filters ─────────────────────────────────
const { data: walletsRaw } = useLazyFetch<any>("/api/wallets");
const { data: categoriesRaw } = useLazyFetch<any>("/api/categories");

const availableWallets = computed(() => walletsRaw.value?.data ?? []);
const availableCategories = computed(() => categoriesRaw.value?.data ?? []);

const MONTHS_ID = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
];

const periodLabel = computed(
    () => `${MONTHS_ID[filter.month - 1]} ${filter.year}`,
);

const prevMonth = () => {
    if (filter.month === 1) {
        filter.month = 12;
        filter.year--;
    } else {
        filter.month--;
    }
};

const nextMonth = () => {
    if (filter.month === 12) {
        filter.month = 1;
        filter.year++;
    } else {
        filter.month++;
    }
};

// ── Fetch transactions ──────────────────────────────────────
const apiUrl = computed(() => {
    const params = new URLSearchParams();
    params.set("month", String(filter.month));
    params.set("year", String(filter.year));
    params.set("limit", "100");
    if (filter.type) params.set("type", filter.type);
    if (filter.categoryId) params.set("categoryId", filter.categoryId);
    if (filter.walletId) params.set("walletId", filter.walletId);
    if (filter.search.trim()) params.set("search", filter.search.trim());
    return `/api/transactions?${params.toString()}`;
});

const {
    data: txRaw,
    status,
    refresh,
} = useLazyFetch<any>(apiUrl, { key: "tx-history", watch: [apiUrl] });

const transactions = computed(() => txRaw.value?.data ?? []);
const loading = computed(() => status.value === "pending" && !txRaw.value);

// ── Group by date ──────────────────────────────────────────
const grouped = computed(() => {
    const groups: { date: string; label: string; items: any[] }[] = [];
    const map = new Map<string, any[]>();

    for (const tx of transactions.value) {
        const d = new Date(tx.date);
        const key = d.toISOString().split("T")[0];
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(tx);
    }

    for (const [date, items] of map) {
        groups.push({
            date,
            label: formatSmart(new Date(date)),
            items,
        });
    }

    return groups;
});

// ── Totals ──────────────────────────────────────────────────
const totals = computed(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions.value) {
        if (tx.type === "INCOME") income += tx.amount;
        else if (tx.type === "EXPENSE") expense += tx.amount;
    }
    return { income, expense, net: income - expense };
});

// ── Delete transaction ──────────────────────────────────────
const showDeleteDialog = ref(false);
const txToDelete = ref<any>(null);
const deleting = ref(false);

const toast = reactive({
    show: false,
    message: "",
    type: "success" as "success" | "error",
});

const confirmDelete = (tx: any) => {
    txToDelete.value = tx;
    showDeleteDialog.value = true;
};

const deleteTx = async () => {
    if (!txToDelete.value || deleting.value) return;
    deleting.value = true;

    try {
        await $fetch(`/api/transactions/${txToDelete.value.id}`, {
            method: "DELETE",
        });
        toast.message = "Transaksi berhasil dihapus";
        toast.type = "success";
        toast.show = true;
        showDeleteDialog.value = false;
        txToDelete.value = null;
        await refresh();
    } catch (err: any) {
        toast.message = err?.data?.message ?? "Gagal menghapus transaksi";
        toast.type = "error";
        toast.show = true;
    } finally {
        deleting.value = false;
    }
};

// ── Search debounce ─────────────────────────────────────────
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const searchInput = ref("");

watch(searchInput, (val) => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        filter.search = val;
    }, 400);
});
</script>

<template>
    <div class="space-y-4 animate-fade-in">
        <!-- ── Header ────────────────────────────────────────────── -->
        <div class="flex items-start justify-between">
            <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Riwayat Transaksi
                </h2>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Semua catatan keuanganmu
                </p>
            </div>

            <!-- Export Button -->
            <a
                :href="`/api/analytics/export?month=${filter.month}&year=${filter.year}`"
                target="_blank"
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all duration-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95"
            >
                <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Excel
            </a>
        </div>

        <!-- ── Month Navigation ──────────────────────────────────── -->
        <div class="flex items-center justify-between px-1">
            <button class="btn-icon w-8 h-8" @click="prevMonth">
                <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="m15 18-6-6 6-6" />
                </svg>
            </button>
            <span class="text-sm font-bold text-gray-800 dark:text-gray-100">
                {{ periodLabel }}
            </span>
            <button class="btn-icon w-8 h-8" @click="nextMonth">
                <svg
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </button>
        </div>

        <!-- ── Summary Cards ─────────────────────────────────────── -->
        <div class="grid grid-cols-3 gap-2">
            <div class="card rounded-2xl p-3 text-center">
                <p
                    class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                >
                    Masuk
                </p>
                <p class="text-sm font-bold text-emerald-500 mt-1">
                    {{ formatIDR(totals.income) }}
                </p>
            </div>
            <div class="card rounded-2xl p-3 text-center">
                <p
                    class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                >
                    Keluar
                </p>
                <p class="text-sm font-bold text-rose-500 mt-1">
                    {{ formatIDR(totals.expense) }}
                </p>
            </div>
            <div class="card rounded-2xl p-3 text-center">
                <p
                    class="text-[10px] font-semibold text-gray-400 uppercase tracking-wide"
                >
                    Bersih
                </p>
                <p
                    class="text-sm font-bold mt-1"
                    :class="
                        totals.net >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    "
                >
                    {{ formatIDR(totals.net) }}
                </p>
            </div>
        </div>

        <!-- ── Filter Type + Search ──────────────────────────────── -->
        <div class="space-y-2">
            <!-- Type filter -->
            <div class="flex gap-1.5 overflow-x-auto no-scrollbar">
                <button
                    class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95"
                    :class="
                        filter.type === ''
                            ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
                            : 'border-gray-200 dark:border-gray-800 text-gray-400'
                    "
                    @click="filter.type = ''"
                >
                    Semua
                </button>
                <button
                    class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95"
                    :class="
                        filter.type === 'INCOME'
                            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                            : 'border-gray-200 dark:border-gray-800 text-gray-400'
                    "
                    @click="filter.type = 'INCOME'"
                >
                    💰 Masuk
                </button>
                <button
                    class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95"
                    :class="
                        filter.type === 'EXPENSE'
                            ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                            : 'border-gray-200 dark:border-gray-800 text-gray-400'
                    "
                    @click="filter.type = 'EXPENSE'"
                >
                    💸 Keluar
                </button>
                <button
                    class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95"
                    :class="
                        filter.type === 'TRANSFER'
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-800 text-gray-400'
                    "
                    @click="filter.type = 'TRANSFER'"
                >
                    🔄 Transfer
                </button>
            </div>

            <!-- Search bar -->
            <div class="relative">
                <svg
                    class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                    v-model="searchInput"
                    type="text"
                    class="input pl-10 text-xs"
                    placeholder="Cari transaksi..."
                />
            </div>

            <!-- Wallet & Category Filter Row -->
            <div class="grid grid-cols-2 gap-2">
                <select
                    v-model="filter.walletId"
                    class="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                    <option value="">Semua Dompet</option>
                    <option
                        v-for="w in availableWallets"
                        :key="w.id"
                        :value="w.id"
                    >
                        {{ w.name }} ({{ formatIDR(w.balance) }})
                    </option>
                </select>

                <select
                    v-model="filter.categoryId"
                    class="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                    <option value="">Semua Kategori</option>
                    <option
                        v-for="c in availableCategories"
                        :key="c.id"
                        :value="c.id"
                    >
                        {{ c.icon }} {{ c.name }}
                    </option>
                </select>
            </div>
        </div>

        <!-- ── Skeleton ──────────────────────────────────────────── -->
        <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="space-y-2">
                <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div
                    v-for="j in 2"
                    :key="j"
                    class="card rounded-2xl p-3.5 animate-pulse flex items-center gap-3"
                >
                    <div
                        class="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700"
                    />
                    <div class="flex-1 space-y-1.5">
                        <div
                            class="h-3.5 w-28 bg-gray-200 dark:bg-gray-700 rounded"
                        />
                        <div
                            class="h-3 w-20 bg-gray-100 dark:bg-gray-800 rounded"
                        />
                    </div>
                    <div
                        class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"
                    />
                </div>
            </div>
        </div>

        <!-- ── Transaction List (grouped by date) ────────────────── -->
        <div v-else-if="grouped.length > 0" class="space-y-4">
            <div v-for="group in grouped" :key="group.date">
                <!-- Date header -->
                <p
                    class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-0.5"
                >
                    {{ group.label }}
                </p>

                <div class="space-y-1.5">
                    <div
                        v-for="tx in group.items"
                        :key="tx.id"
                        class="card rounded-2xl p-3.5 transition-all duration-200 hover:shadow-card-md"
                    >
                        <div class="flex items-center gap-3">
                            <!-- Category icon -->
                            <span
                                class="flex items-center justify-center w-9 h-9 rounded-xl text-base leading-none flex-shrink-0"
                                :style="{
                                    backgroundColor: tx.category.color + '20',
                                }"
                            >
                                {{ tx.category.icon }}
                            </span>

                            <!-- Details -->
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-1.5 truncate">
                                    <p
                                        class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate"
                                    >
                                        {{ tx.description || tx.category.name }}
                                    </p>
                                    <!-- Promo Badge -->
                                    <span
                                        v-if="tx.isPromo"
                                        class="flex-shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/40 text-[9px] font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50"
                                        title="Transaksi dengan Promo"
                                    >
                                        🏷️ PROMO
                                    </span>
                                </div>
                                <p
                                    class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate"
                                >
                                    <template v-if="tx.type === 'TRANSFER'">
                                        {{ tx.walletFrom?.name ?? "?" }} →
                                        {{ tx.walletTo?.name ?? "?" }}
                                    </template>
                                    <template v-else-if="tx.type === 'EXPENSE'">
                                        {{ tx.walletFrom?.name ?? "Unknown" }} ·
                                        {{ tx.category.name }}
                                        <span
                                            v-if="
                                                tx.quantity > 1 ||
                                                tx.unitPrice > 0
                                            "
                                            class="ml-1 text-gray-300 dark:text-gray-600"
                                            >|</span
                                        >
                                        <span
                                            v-if="
                                                tx.quantity > 1 ||
                                                tx.unitPrice > 0
                                            "
                                            class="ml-1 font-medium text-gray-500 dark:text-gray-400"
                                        >
                                            {{ tx.quantity }}x
                                            {{
                                                formatIDR(
                                                    tx.unitPrice || tx.amount,
                                                )
                                            }}
                                        </span>
                                    </template>
                                    <template v-else>
                                        {{ tx.walletTo?.name ?? "Unknown" }} ·
                                        {{ tx.category.name }}
                                    </template>
                                </p>

                                <!-- Promo Info Detail -->
                                <p
                                    v-if="tx.isPromo"
                                    class="text-[10px] font-medium text-amber-500/80 mt-1 truncate italic"
                                >
                                    <span v-if="tx.promoType === 'PERCENTAGE'"
                                        >Diskon {{ tx.promoValue }}%</span
                                    >
                                    <span v-else-if="tx.promoType === 'FIXED'"
                                        >Potongan
                                        {{ formatIDR(tx.promoValue) }}</span
                                    >
                                    <span
                                        v-else-if="
                                            tx.promoType === 'BUY_X_GET_Y'
                                        "
                                        >{{ tx.promoDetails }}</span
                                    >
                                </p>
                            </div>

                            <!-- Amount -->
                            <div class="flex-shrink-0 text-right">
                                <p
                                    class="text-sm font-bold"
                                    :class="
                                        tx.type === 'INCOME'
                                            ? 'text-emerald-500'
                                            : tx.type === 'EXPENSE'
                                              ? 'text-rose-500'
                                              : 'text-blue-500'
                                    "
                                >
                                    {{
                                        tx.type === "INCOME"
                                            ? "+"
                                            : tx.type === "EXPENSE"
                                              ? "-"
                                              : ""
                                    }}{{ formatIDR(tx.amount) }}
                                </p>
                            </div>
                        </div>

                        <!-- Action buttons -->
                        <div
                            class="flex justify-end gap-3 mt-2 pt-2 border-t border-gray-50 dark:border-gray-800/50"
                        >
                            <NuxtLink
                                :to="`/edit-transaction/${tx.id}`"
                                class="text-[11px] font-medium text-primary-400 hover:text-primary-500 transition-colors px-2 py-0.5"
                            >
                                ✏️ Edit
                            </NuxtLink>
                            <button
                                class="text-[11px] font-medium text-rose-400 hover:text-rose-500 transition-colors px-2 py-0.5"
                                @click="confirmDelete(tx)"
                            >
                                🗑️ Hapus
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Empty state ───────────────────────────────────────── -->
        <div v-else class="card rounded-2xl p-10 text-center">
            <span class="text-4xl">📭</span>
            <p
                class="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-3"
            >
                Belum ada transaksi
            </p>
            <p class="text-xs text-gray-400 mt-1">
                {{
                    filter.type || filter.search
                        ? "Coba ubah filter pencarian"
                        : `Untuk ${periodLabel}`
                }}
            </p>
            <NuxtLink
                to="/add-transaction"
                class="inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:scale-95 transition-all duration-150"
            >
                <span>+</span>
                Tambah Transaksi
            </NuxtLink>
        </div>

        <!-- Bottom spacer -->
        <div class="h-2" />

        <!-- ── Delete Confirm ────────────────────────────────────── -->
        <ConfirmDialog
            v-model="showDeleteDialog"
            title="Hapus Transaksi?"
            :message="`Transaksi ${txToDelete?.description || txToDelete?.category?.name || ''} sebesar ${txToDelete ? formatIDR(txToDelete.amount) : ''} akan dihapus dan saldo dompet dikembalikan.`"
            confirm-text="Ya, Hapus"
            cancel-text="Batal"
            variant="danger"
            icon="🗑️"
            :loading="deleting"
            @confirm="deleteTx"
        />

        <Toast
            v-model="toast.show"
            :message="toast.message"
            :type="toast.type"
        />
    </div>
</template>

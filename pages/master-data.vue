<script setup lang="ts">
// pages/master-data.vue — Phase 3: CRUD Master Data
// Tabs: Dompet | Kategori | Budget

useHead({ title: "Master Data — CashPlow" });

const { formatIDR, formatCompact } = useCurrency();

// ── Active tab ────────────────────────────────────────────────
const activeTab = ref<"wallet" | "category" | "budget">("wallet");

const tabs = [
    { id: "wallet" as const, label: "Dompet", icon: "👛" },
    { id: "category" as const, label: "Kategori", icon: "🏷️" },
    { id: "budget" as const, label: "Budget", icon: "🎯" },
];

// ── Toast ─────────────────────────────────────────────────────
const toast = reactive({
    show: false,
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
});

const showToast = (message: string, type: typeof toast.type = "success") => {
    toast.message = message;
    toast.type = type;
    toast.show = true;
};

// ══════════════════════════════════════════════════════════════
//  WALLET TAB
// ══════════════════════════════════════════════════════════════

const {
    data: walletsRaw,
    status: walletStatus,
    refresh: refreshWallets,
} = useLazyFetch<any>("/api/wallets", { key: "master-wallets" });

const walletSearch = ref("");
const wallets = computed(() => {
    let list = walletsRaw.value?.data ?? [];

    // Search filter
    if (walletSearch.value.trim()) {
        const s = walletSearch.value.toLowerCase();
        list = list.filter(
            (w: any) =>
                w.name.toLowerCase().includes(s) ||
                w.type.toLowerCase().includes(s),
        );
    }

    // Sort by balance (highest first)
    return [...list].sort((a, b) => b.balance - a.balance);
});
const walletLoading = computed(
    () => walletStatus.value === "pending" && !walletsRaw.value,
);

// Wallet form state
const showWalletForm = ref(false);
const walletFormMode = ref<"create" | "edit">("create");
const walletSaving = ref(false);

const walletForm = reactive({
    id: "",
    name: "",
    type: "CASH",
    balance: 0,
    color: "#10b981",
    icon: "💵",
    isDefault: false,
    description: "",
});

const walletTypes = [
    { value: "CASH", label: "Tunai", icon: "💵" },
    { value: "BANK", label: "Bank", icon: "🏦" },
    { value: "E_WALLET", label: "E-Wallet", icon: "📱" },
    { value: "INVESTMENT", label: "Investasi", icon: "📈" },
    { value: "OTHER", label: "Lainnya", icon: "💳" },
];

const walletIcons: Record<string, string> = {
    CASH: "💵",
    BANK: "🏦",
    E_WALLET: "📱",
    INVESTMENT: "📈",
    OTHER: "💳",
};

const walletTypeLabel = (type: string) =>
    walletTypes.find((t) => t.value === type)?.label ?? type;

const openWalletCreate = () => {
    walletFormMode.value = "create";
    Object.assign(walletForm, {
        id: "",
        name: "",
        type: "CASH",
        balance: 0,
        color: "#10b981",
        icon: "💵",
        isDefault: false,
        description: "",
    });
    showWalletForm.value = true;
};

const openWalletEdit = (wallet: any) => {
    walletFormMode.value = "edit";
    Object.assign(walletForm, {
        id: wallet.id,
        name: wallet.name,
        type: wallet.type,
        balance: wallet.balance,
        color: wallet.color,
        icon: walletIcons[wallet.type] ?? "💵",
        isDefault: wallet.isDefault,
        description: wallet.description ?? "",
    });
    showWalletForm.value = true;
};

const saveWallet = async () => {
    if (walletSaving.value) return;
    walletSaving.value = true;

    try {
        if (walletFormMode.value === "create") {
            await $fetch("/api/wallets", {
                method: "POST",
                body: {
                    name: walletForm.name,
                    type: walletForm.type,
                    balance: walletForm.balance,
                    icon: walletForm.icon,
                    isDefault: walletForm.isDefault,
                    description: walletForm.description || undefined,
                },
            });
            showToast("Dompet berhasil ditambahkan");
        } else {
            await $fetch(`/api/wallets/${walletForm.id}`, {
                method: "PUT",
                body: {
                    name: walletForm.name,
                    type: walletForm.type,
                    balance: walletForm.balance,
                    icon: walletForm.icon,
                    isDefault: walletForm.isDefault,
                    description: walletForm.description || undefined,
                },
            });
            showToast("Dompet berhasil diperbarui");
        }

        showWalletForm.value = false;
        await refreshWallets();
    } catch (err: any) {
        showToast(err?.data?.message ?? "Gagal menyimpan dompet", "error");
    } finally {
        walletSaving.value = false;
    }
};

// Wallet delete
const showDeleteWallet = ref(false);
const walletToDelete = ref<any>(null);
const walletDeleting = ref(false);

const confirmDeleteWallet = (wallet: any) => {
    walletToDelete.value = wallet;
    showDeleteWallet.value = true;
};

const deleteWallet = async () => {
    if (!walletToDelete.value || walletDeleting.value) return;
    walletDeleting.value = true;

    try {
        await $fetch(`/api/wallets/${walletToDelete.value.id}`, {
            method: "DELETE",
        });
        showToast("Dompet berhasil dihapus");
        showDeleteWallet.value = false;
        walletToDelete.value = null;
        await refreshWallets();
    } catch (err: any) {
        showToast(err?.data?.message ?? "Gagal menghapus dompet", "error");
    } finally {
        walletDeleting.value = false;
    }
};

// Set default wallet
const setDefaultWallet = async (walletId: string) => {
    try {
        await $fetch(`/api/wallets/${walletId}`, {
            method: "PUT",
            body: { isDefault: true },
        });
        showToast("Dompet utama berhasil diubah");
        await refreshWallets();
    } catch (err: any) {
        showToast(err?.data?.message ?? "Gagal mengubah dompet utama", "error");
    }
};

// ══════════════════════════════════════════════════════════════
//  CATEGORY TAB
// ══════════════════════════════════════════════════════════════

const categorySubTab = ref<"EXPENSE" | "INCOME">("EXPENSE");

const {
    data: categoriesRaw,
    status: categoryStatus,
    refresh: refreshCategories,
} = useLazyFetch<any>("/api/categories", { key: "master-categories" });

const categorySearch = ref("");
const categories = computed(() => categoriesRaw.value?.data ?? []);

const filteredCategories = computed(() => {
    let list = categories.value.filter(
        (c: any) => c.type === categorySubTab.value,
    );

    if (categorySearch.value.trim()) {
        const s = categorySearch.value.toLowerCase();
        list = list.filter((c: any) => c.name.toLowerCase().includes(s));
    }

    return list;
});

const categoryLoading = computed(
    () => categoryStatus.value === "pending" && !categoriesRaw.value,
);

// Category form
const showCategoryForm = ref(false);
const categoryFormMode = ref<"create" | "edit">("create");
const categorySaving = ref(false);

const categoryForm = reactive({
    id: "",
    name: "",
    type: "EXPENSE" as "EXPENSE" | "INCOME",
    color: "#10b981",
    icon: "🏷️",
    isDefault: false,
    description: "",
});

const categoryIcons = [
    // Food & Drink
    "🍔",
    "🍕",
    "🍜",
    "🍱",
    "🍦",
    "☕",
    "🍺",
    "🥤",
    "🍎",
    "🥦",
    // Transport & Travel
    "🚗",
    "🚲",
    "🏍️",
    "🚌",
    "🚆",
    "✈️",
    "🛳️",
    "⛽",
    "🅿️",
    "🗺️",
    // Shopping & Lifestyle
    "🛒",
    "🛍️",
    "👕",
    "👟",
    "💄",
    "💍",
    "🎮",
    "🎲",
    "🎸",
    "🎬",
    // Home & Utilities
    "🏠",
    "🛋️",
    "🧹",
    "⚡",
    "💧",
    "📶",
    "📦",
    "🔧",
    "🔨",
    "🧺",
    // Health & Personal Care
    "🏥",
    "💊",
    "💉",
    "🦷",
    "👓",
    "💆",
    "✂️",
    "🧴",
    "🏋️",
    "🧘",
    // Finance & Work
    "💰",
    "💳",
    "🧾",
    "💼",
    "📈",
    "🏢",
    "📝",
    "💻",
    "🖨️",
    "📮",
    // Education & Misc
    "📚",
    "🎓",
    "🎨",
    "🎭",
    "🎁",
    "🎈",
    "🎉",
    "🌟",
    "🛡️",
    "🏷️",
];

const categoryColors = [
    "#10b981",
    "#059669",
    "#047857", // Emeralds
    "#3b82f6",
    "#2563eb",
    "#1d4ed8", // Blues
    "#f59e0b",
    "#d97706",
    "#b45309", // Ambers
    "#ef4444",
    "#dc2626",
    "#b91c1c", // Reds
    "#8b5cf6",
    "#7c3aed",
    "#6d28d9", // Violets
    "#ec4899",
    "#db2777",
    "#be185d", // Pinks
    "#06b6d4",
    "#0891b2",
    "#0e7490", // Cyans
    "#f97316",
    "#ea580c",
    "#c2410c", // Oranges
    "#6366f1",
    "#4f46e5",
    "#4338ca", // Indigos
    "#84cc16",
    "#65a30d",
    "#4d7c0f", // Limes
    "#6b7280",
    "#4b5563",
    "#374151", // Grays
];

const openCategoryCreate = () => {
    categoryFormMode.value = "create";
    Object.assign(categoryForm, {
        id: "",
        name: "",
        type: categorySubTab.value,
        color: "#10b981",
        icon: "🏷️",
        isDefault: false,
        description: "",
    });
    showCategoryForm.value = true;
};

const openCategoryEdit = (cat: any) => {
    categoryFormMode.value = "edit";
    Object.assign(categoryForm, {
        id: cat.id,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        icon: cat.icon,
        isDefault: cat.isDefault,
        description: cat.description ?? "",
    });
    showCategoryForm.value = true;
};

const saveCategory = async () => {
    if (categorySaving.value) return;
    categorySaving.value = true;

    try {
        if (categoryFormMode.value === "create") {
            await $fetch("/api/categories", {
                method: "POST",
                body: {
                    name: categoryForm.name,
                    type: categoryForm.type,
                    color: categoryForm.color,
                    icon: categoryForm.icon,
                    isDefault: categoryForm.isDefault,
                    description: categoryForm.description || undefined,
                },
            });
            showToast("Kategori berhasil ditambahkan");
        } else {
            await $fetch(`/api/categories/${categoryForm.id}`, {
                method: "PUT",
                body: {
                    name: categoryForm.name,
                    color: categoryForm.color,
                    icon: categoryForm.icon,
                    isDefault: categoryForm.isDefault,
                    description: categoryForm.description || undefined,
                },
            });
            showToast("Kategori berhasil diperbarui");
        }

        showCategoryForm.value = false;
        await refreshCategories();
    } catch (err: any) {
        showToast(err?.data?.message ?? "Gagal menyimpan kategori", "error");
    } finally {
        categorySaving.value = false;
    }
};

// Category delete
const showDeleteCategory = ref(false);
const categoryToDelete = ref<any>(null);
const categoryDeleting = ref(false);

const confirmDeleteCategory = (cat: any) => {
    categoryToDelete.value = cat;
    showDeleteCategory.value = true;
};

const deleteCategory = async () => {
    if (!categoryToDelete.value || categoryDeleting.value) return;
    categoryDeleting.value = true;

    try {
        await $fetch(`/api/categories/${categoryToDelete.value.id}`, {
            method: "DELETE",
        });
        showToast("Kategori berhasil dihapus");
        showDeleteCategory.value = false;
        categoryToDelete.value = null;
        await refreshCategories();
    } catch (err: any) {
        showToast(err?.data?.message ?? "Gagal menghapus kategori", "error");
    } finally {
        categoryDeleting.value = false;
    }
};

// ══════════════════════════════════════════════════════════════
//  BUDGET TAB
// ══════════════════════════════════════════════════════════════

const now = new Date();
const budgetPeriod = reactive({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
});

const {
    data: budgetsRaw,
    status: budgetStatus,
    refresh: refreshBudgets,
} = useLazyFetch<any>(
    () => `/api/budgets?month=${budgetPeriod.month}&year=${budgetPeriod.year}`,
    {
        key: "master-budgets",
        watch: [() => budgetPeriod.month, () => budgetPeriod.year],
    },
);

const budgetData = computed(
    () => budgetsRaw.value?.data ?? { budgets: [], availableCategories: [] },
);
const budgetLoading = computed(
    () => budgetStatus.value === "pending" && !budgetsRaw.value,
);

// Budget form
const showBudgetForm = ref(false);
const budgetFormMode = ref<"create" | "edit">("create");
const budgetSaving = ref(false);

const budgetForm = reactive({
    id: "",
    categoryId: "",
    amount: 0,
});

const openBudgetCreate = () => {
    budgetFormMode.value = "create";
    Object.assign(budgetForm, { id: "", categoryId: "", amount: 0 });
    showBudgetForm.value = true;
};

const openBudgetEdit = (budget: any) => {
    budgetFormMode.value = "edit";
    Object.assign(budgetForm, {
        id: budget.id,
        categoryId: budget.categoryId,
        amount: budget.budgeted,
    });
    showBudgetForm.value = true;
};

const saveBudget = async () => {
    if (budgetSaving.value) return;
    budgetSaving.value = true;

    try {
        if (budgetFormMode.value === "create") {
            await $fetch("/api/budgets", {
                method: "POST",
                body: {
                    categoryId: budgetForm.categoryId,
                    amount: budgetForm.amount,
                    month: budgetPeriod.month,
                    year: budgetPeriod.year,
                },
            });
            showToast("Budget berhasil ditambahkan");
        } else {
            await $fetch(`/api/budgets/${budgetForm.id}`, {
                method: "PUT",
                body: { amount: budgetForm.amount },
            });
            showToast("Budget berhasil diperbarui");
        }

        showBudgetForm.value = false;
        await refreshBudgets();
    } catch (err: any) {
        showToast(err?.data?.message ?? "Gagal menyimpan budget", "error");
    } finally {
        budgetSaving.value = false;
    }
};

// Budget delete
const showDeleteBudget = ref(false);
const budgetToDelete = ref<any>(null);
const budgetDeleting = ref(false);

const confirmDeleteBudget = (budget: any) => {
    budgetToDelete.value = budget;
    showDeleteBudget.value = true;
};

const deleteBudget = async () => {
    if (!budgetToDelete.value || budgetDeleting.value) return;
    budgetDeleting.value = true;

    try {
        await $fetch(`/api/budgets/${budgetToDelete.value.id}`, {
            method: "DELETE",
        });
        showToast("Budget berhasil dihapus");
        showDeleteBudget.value = false;
        budgetToDelete.value = null;
        await refreshBudgets();
    } catch (err: any) {
        showToast(err?.data?.message ?? "Gagal menghapus budget", "error");
    } finally {
        budgetDeleting.value = false;
    }
};

// Budget month navigation
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

const budgetPeriodLabel = computed(
    () => `${MONTHS_ID[budgetPeriod.month - 1]} ${budgetPeriod.year}`,
);

const prevBudgetMonth = () => {
    if (budgetPeriod.month === 1) {
        budgetPeriod.month = 12;
        budgetPeriod.year--;
    } else {
        budgetPeriod.month--;
    }
};

const nextBudgetMonth = () => {
    if (budgetPeriod.month === 12) {
        budgetPeriod.month = 1;
        budgetPeriod.year++;
    } else {
        budgetPeriod.month++;
    }
};

const getBudgetBarColor = (percentage: number) => {
    if (percentage >= 100) return "bg-rose-500";
    if (percentage >= 85) return "bg-amber-500";
    return "bg-emerald-500";
};

const getBudgetTextColor = (percentage: number) => {
    if (percentage >= 100) return "text-rose-500";
    if (percentage >= 85) return "text-amber-500";
    return "text-emerald-600 dark:text-emerald-400";
};

// ── Budget amount input formatting ────────────────────────────
const budgetAmountDisplay = ref("");

watch(
    () => showBudgetForm.value,
    (open) => {
        if (open && budgetForm.amount > 0) {
            budgetAmountDisplay.value =
                budgetForm.amount.toLocaleString("id-ID");
        } else if (open) {
            budgetAmountDisplay.value = "";
        }
    },
);

const onBudgetAmountInput = (e: Event) => {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
    const num = parseInt(raw) || 0;
    budgetForm.amount = num;
    budgetAmountDisplay.value = num > 0 ? num.toLocaleString("id-ID") : "";
};

// ── Wallet balance input formatting ────────────────────────────
const walletBalanceDisplay = ref("");

watch(
    () => showWalletForm.value,
    (open) => {
        if (open && walletForm.balance > 0) {
            walletBalanceDisplay.value =
                walletForm.balance.toLocaleString("id-ID");
        } else if (open) {
            walletBalanceDisplay.value = "";
        }
    },
);

const onWalletBalanceInput = (e: Event) => {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
    const num = parseInt(raw) || 0;
    walletForm.balance = num;
    walletBalanceDisplay.value = num > 0 ? num.toLocaleString("id-ID") : "";
};
</script>

<template>
    <div class="space-y-4 animate-fade-in">
        <!-- ── Page Title ──────────────────────────────────────────── -->
        <div>
            <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                Master Data
            </h2>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Kelola dompet, kategori & budget
            </p>
        </div>

        <!-- ── Tab Bar ──────────────────────────────────────────────── -->
        <div
            class="flex gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/60"
        >
            <button
                v-for="tab in tabs"
                :key="tab.id"
                class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
                :class="
                    activeTab === tab.id
                        ? 'bg-white dark:bg-surface-900 text-gray-800 dark:text-gray-100 shadow-card'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                "
                @click="activeTab = tab.id"
            >
                <span class="text-sm leading-none">{{ tab.icon }}</span>
                <span>{{ tab.label }}</span>
            </button>
        </div>

        <!-- ══════════════════════════════════════════════════════════
         TAB: DOMPET
    ══════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'wallet'" class="space-y-4">
            <!-- Search Wallet -->
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
                    v-model="walletSearch"
                    type="text"
                    class="input pl-10 text-xs"
                    placeholder="Cari nama dompet atau tipe..."
                />
            </div>

            <!-- Wallet Grid (3 Columns) -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <!-- FIRST CARD: ADD WALLET -->
                <button
                    class="aspect-square rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/10 transition-all duration-300 active:scale-95 group"
                    @click="openWalletCreate"
                >
                    <div
                        class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-2xl font-bold group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 shadow-sm"
                    >
                        +
                    </div>
                    <span
                        class="text-[10px] font-black text-gray-400 group-hover:text-primary-500 uppercase tracking-widest"
                        >Tambah</span
                    >
                </button>

                <!-- WALLET LIST -->
                <template v-if="walletLoading">
                    <div
                        v-for="i in 5"
                        :key="i"
                        class="aspect-square rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                    />
                </template>

                <template v-else>
                    <div
                        v-for="wallet in wallets"
                        :key="wallet.id"
                        class="relative aspect-square rounded-[32px] p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 cursor-pointer group shadow-md"
                        :class="
                            wallet.type === 'BANK'
                                ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                                : wallet.type === 'CASH'
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                                  : wallet.type === 'E_WALLET'
                                    ? 'bg-gradient-to-br from-sky-400 to-sky-600 text-white'
                                    : wallet.type === 'INVESTMENT'
                                      ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                                      : 'bg-gradient-to-br from-slate-500 to-slate-700 text-white'
                        "
                        @click="openWalletEdit(wallet)"
                    >
                        <!-- Even Larger Background Icon -->
                        <span
                            class="absolute -right-4 -bottom-6 text-[100px] opacity-25 pointer-events-none group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 leading-none"
                        >
                            {{ walletIcons[wallet.type] ?? "💳" }}
                        </span>

                        <!-- Badge Default -->
                        <div
                            v-if="wallet.isDefault"
                            class="absolute top-4 right-4 bg-white/30 backdrop-blur-md text-white text-[9px] font-black px-2 py-0.5 rounded-lg border border-white/40 z-10 uppercase tracking-tighter"
                        >
                            Utama
                        </div>

                        <!-- Content Top -->
                        <div class="relative z-10 pt-1">
                            <p
                                class="text-[10px] font-black uppercase tracking-[0.25em] opacity-80 mb-1.5"
                            >
                                {{ walletTypeLabel(wallet.type) }}
                            </p>
                            <p
                                class="text-lg font-extrabold leading-tight drop-shadow-md line-clamp-2"
                            >
                                {{ wallet.name }}
                            </p>
                        </div>

                        <!-- Content Bottom -->
                        <div class="relative z-10 pb-1">
                            <p
                                class="text-xl font-bold leading-none tracking-tight drop-shadow-lg truncate"
                            >
                                {{ formatIDR(wallet.balance) }}
                            </p>
                        </div>

                        <!-- Action Overlay -->
                        <div
                            class="absolute inset-0 z-20 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[3px]"
                        >
                            <button
                                v-if="!wallet.isDefault"
                                @click.stop="setDefaultWallet(wallet.id)"
                                class="w-10 h-10 flex items-center justify-center bg-white rounded-2xl text-lg shadow-xl transform translate-y-6 group-hover:translate-y-0 transition-all duration-300"
                                title="Utama"
                            >
                                ⭐
                            </button>
                            <button
                                @click.stop="confirmDeleteWallet(wallet)"
                                class="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-2xl text-lg shadow-xl transform translate-y-6 group-hover:translate-y-0 transition-all duration-300 delay-75"
                                title="Hapus"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Empty state -->
            <div
                v-if="!walletLoading && wallets.length === 0"
                class="py-10 text-center"
            >
                <span class="text-4xl grayscale">👛</span>
                <p class="text-xs font-bold text-gray-400 mt-2">
                    Dompet tidak ditemukan
                </p>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
         TAB: KATEGORI
    ══════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'category'" class="space-y-4">
            <!-- Sub-tabs: Pengeluaran / Pemasukan -->
            <div class="flex gap-2">
                <button
                    class="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                    :class="
                        categorySubTab === 'EXPENSE'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    "
                    @click="categorySubTab = 'EXPENSE'"
                >
                    <span>💸</span> Pengeluaran
                </button>
                <button
                    class="flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
                    :class="
                        categorySubTab === 'INCOME'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    "
                    @click="categorySubTab = 'INCOME'"
                >
                    <span>💰</span> Pemasukan
                </button>
            </div>

            <!-- Search Category -->
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
                    v-model="categorySearch"
                    type="text"
                    class="input pl-10 text-xs"
                    placeholder="Cari kategori..."
                />
            </div>

            <!-- Category Grid -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <!-- FIRST CARD: ADD CATEGORY -->
                <button
                    class="aspect-square rounded-[32px] border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50/10 transition-all duration-300 active:scale-95 group"
                    @click="openCategoryCreate"
                >
                    <div
                        class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-2xl font-bold group-hover:bg-primary-500 group-hover:text-white transition-all duration-300 shadow-sm"
                    >
                        +
                    </div>
                    <span
                        class="text-[10px] font-black text-gray-400 group-hover:text-primary-500 uppercase tracking-widest"
                        >Tambah</span
                    >
                </button>

                <!-- CATEGORY LIST -->
                <template v-if="categoryLoading">
                    <div
                        v-for="i in 5"
                        :key="i"
                        class="aspect-square rounded-[32px] bg-gray-100 dark:bg-gray-800 animate-pulse"
                    />
                </template>

                <template v-else>
                    <div
                        v-for="cat in filteredCategories"
                        :key="cat.id"
                        class="relative aspect-square rounded-[32px] p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer group shadow-md"
                        :style="{
                            backgroundColor: cat.color,
                            backgroundImage:
                                'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.1) 100%)',
                        }"
                        @click="openCategoryEdit(cat)"
                    >
                        <!-- Large Background Icon -->
                        <span
                            class="absolute -right-3 -bottom-5 text-[90px] opacity-20 pointer-events-none group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 leading-none"
                        >
                            {{ cat.icon }}
                        </span>

                        <!-- Badge Default -->
                        <div
                            v-if="cat.isDefault"
                            class="absolute top-4 right-4 bg-white/30 backdrop-blur-md text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg border border-white/40 z-10 uppercase tracking-tighter"
                        >
                            Default
                        </div>

                        <!-- Content Top -->
                        <div class="relative z-10 pt-1">
                            <p
                                class="text-white text-base font-extrabold leading-tight drop-shadow-md line-clamp-2"
                            >
                                {{ cat.name }}
                            </p>
                        </div>

                        <!-- Content Bottom (Stats) -->
                        <div class="relative z-10">
                            <p
                                class="text-white text-[9px] font-black uppercase tracking-widest opacity-80"
                            >
                                {{ cat.transactionCount || 0 }} Transaksi
                            </p>
                        </div>

                        <!-- Action Overlay -->
                        <div
                            class="absolute inset-0 z-20 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]"
                        >
                            <button
                                @click.stop="openCategoryEdit(cat)"
                                class="w-10 h-10 flex items-center justify-center bg-white rounded-2xl text-lg shadow-xl"
                                title="Edit"
                            >
                                ✏️
                            </button>
                            <button
                                v-if="!cat.isDefault"
                                @click.stop="confirmDeleteCategory(cat)"
                                class="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-2xl text-lg shadow-xl"
                                title="Hapus"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                </template>
            </div>

            <!-- Empty state -->
            <div
                v-if="!categoryLoading && filteredCategories.length === 0"
                class="py-10 text-center"
            >
                <span class="text-4xl grayscale">🏷️</span>
                <p class="text-xs font-bold text-gray-400 mt-2">
                    Kategori tidak ditemukan
                </p>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════
         TAB: BUDGET
    ══════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'budget'" class="space-y-3">
            <!-- Month navigation -->
            <div class="flex items-center justify-between px-1">
                <button class="btn-icon w-8 h-8" @click="prevBudgetMonth">
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
                <span
                    class="text-sm font-bold text-gray-800 dark:text-gray-100"
                >
                    {{ budgetPeriodLabel }}
                </span>
                <button class="btn-icon w-8 h-8" @click="nextBudgetMonth">
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

            <!-- Add button -->
            <button
                v-if="budgetData.availableCategories.length > 0"
                class="w-full card rounded-2xl p-4 flex items-center gap-3 border-2 border-dashed border-primary-200 dark:border-primary-900/50 hover:border-primary-400 dark:hover:border-primary-700 transition-colors duration-200 active:scale-[0.98]"
                @click="openBudgetCreate"
            >
                <span
                    class="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-500 text-lg"
                    >+</span
                >
                <div class="text-left">
                    <p
                        class="text-sm font-semibold text-primary-600 dark:text-primary-400"
                    >
                        Atur Budget
                    </p>
                    <p class="text-[11px] text-gray-400 dark:text-gray-500">
                        {{ budgetData.availableCategories.length }} kategori
                        tersedia
                    </p>
                </div>
            </button>

            <!-- Skeleton -->
            <div v-if="budgetLoading" class="space-y-3">
                <div
                    v-for="i in 3"
                    :key="i"
                    class="card rounded-2xl p-4 animate-pulse space-y-3"
                >
                    <div class="flex items-center gap-3">
                        <div
                            class="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700"
                        />
                        <div class="flex-1 space-y-2">
                            <div
                                class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"
                            />
                            <div
                                class="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Budget list -->
            <div
                v-for="budget in budgetData.budgets"
                :key="budget.id"
                class="card rounded-2xl p-4 transition-all duration-200 hover:shadow-card-md"
            >
                <div class="flex items-center gap-3 mb-3">
                    <span
                        class="flex items-center justify-center w-9 h-9 rounded-xl text-base leading-none"
                        :style="{ backgroundColor: budget.color + '20' }"
                    >
                        {{ budget.icon }}
                    </span>
                    <div class="flex-1 min-w-0">
                        <p
                            class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate"
                        >
                            {{ budget.category }}
                        </p>
                        <p
                            class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5"
                        >
                            {{ formatIDR(budget.spent) }} /
                            {{ formatIDR(budget.budgeted) }}
                        </p>
                    </div>
                    <span
                        class="text-sm font-bold"
                        :class="getBudgetTextColor(budget.percentage)"
                    >
                        {{ budget.percentage }}%
                    </span>
                </div>

                <!-- Progress bar -->
                <div class="progress-track">
                    <div
                        class="h-full rounded-full transition-all duration-500"
                        :class="getBudgetBarColor(budget.percentage)"
                        :style="{
                            width: Math.min(budget.percentage, 100) + '%',
                        }"
                    />
                </div>

                <!-- Remaining -->
                <div class="flex items-center justify-between mt-2">
                    <span class="text-[11px] text-gray-400 dark:text-gray-500">
                        {{ budget.remaining >= 0 ? "Sisa" : "Lebih" }}:
                        <span
                            class="font-semibold"
                            :class="
                                budget.remaining >= 0
                                    ? 'text-emerald-500'
                                    : 'text-rose-500'
                            "
                        >
                            {{ formatIDR(Math.abs(budget.remaining)) }}
                        </span>
                    </span>

                    <div class="flex items-center gap-1">
                        <button
                            class="btn-icon w-7 h-7 text-gray-400 hover:text-gray-600"
                            @click="openBudgetEdit(budget)"
                        >
                            <svg
                                class="w-3 h-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"
                                />
                            </svg>
                        </button>
                        <button
                            class="btn-icon w-7 h-7 text-rose-400 hover:text-rose-500"
                            @click="confirmDeleteBudget(budget)"
                        >
                            <svg
                                class="w-3 h-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path d="M3 6h18" />
                                <path
                                    d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty -->
            <div
                v-if="!budgetLoading && budgetData.budgets.length === 0"
                class="card rounded-2xl p-8 text-center"
            >
                <span class="text-4xl">🎯</span>
                <p
                    class="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-2"
                >
                    Belum ada budget untuk {{ budgetPeriodLabel }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                    Atur budget untuk mengontrol pengeluaran
                </p>
            </div>
        </div>

        <!-- Bottom spacer -->
        <div class="h-2" />

        <!-- ══════════════════════════════════════════════════════════
         BOTTOM SHEETS & DIALOGS
    ══════════════════════════════════════════════════════════ -->

        <!-- ── Wallet Form ─────────────────────────────────────────── -->
        <BottomSheet
            v-model="showWalletForm"
            :title="
                walletFormMode === 'create' ? 'Tambah Dompet' : 'Edit Dompet'
            "
            :subtitle="
                walletFormMode === 'create'
                    ? 'Buat dompet baru'
                    : 'Perbarui informasi dompet'
            "
        >
            <div class="space-y-4">
                <!-- Name -->
                <div>
                    <label
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block"
                    >
                        Nama Dompet
                    </label>
                    <input
                        v-model="walletForm.name"
                        type="text"
                        class="input"
                        placeholder="contoh: Cash, BCA, GoPay"
                    />
                </div>

                <!-- Type -->
                <div>
                    <label
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block"
                    >
                        Tipe
                    </label>
                    <div class="grid grid-cols-3 gap-2">
                        <button
                            v-for="wt in walletTypes"
                            :key="wt.value"
                            class="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-200 active:scale-95"
                            :class="
                                walletForm.type === wt.value
                                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                                    : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400'
                            "
                            @click="
                                walletForm.type = wt.value;
                                walletForm.icon = wt.icon;
                            "
                        >
                            <span class="text-lg">{{ wt.icon }}</span>
                            <span>{{ wt.label }}</span>
                        </button>
                    </div>
                </div>

                <!-- Balance -->
                <div>
                    <label
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block"
                    >
                        Saldo Awal
                    </label>
                    <div class="relative">
                        <span
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400"
                            >Rp</span
                        >
                        <input
                            :value="walletBalanceDisplay"
                            type="text"
                            inputmode="numeric"
                            class="input pl-10"
                            placeholder="0"
                            @input="onWalletBalanceInput"
                        />
                    </div>
                </div>

                <!-- Default Checkbox -->
                <div
                    class="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                >
                    <div class="flex items-center gap-3">
                        <span class="text-xl">⭐</span>
                        <div>
                            <p
                                class="text-sm font-bold text-gray-800 dark:text-gray-100"
                            >
                                Dompet Utama
                            </p>
                            <p class="text-[10px] text-gray-400">
                                Gunakan sebagai pilihan otomatis
                            </p>
                        </div>
                    </div>
                    <input
                        v-model="walletForm.isDefault"
                        type="checkbox"
                        class="w-6 h-6 rounded-lg text-primary-500 border-gray-300 focus:ring-primary-500"
                    />
                </div>
            </div>

            <template #footer>
                <button
                    class="btn-primary w-full flex items-center justify-center gap-2"
                    :disabled="!walletForm.name.trim() || walletSaving"
                    @click="saveWallet"
                >
                    <svg
                        v-if="walletSaving"
                        class="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        />
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    {{
                        walletFormMode === "create"
                            ? "Tambah Dompet"
                            : "Simpan Perubahan"
                    }}
                </button>
            </template>
        </BottomSheet>

        <!-- ── Category Form ───────────────────────────────────────── -->
        <BottomSheet
            v-model="showCategoryForm"
            :title="
                categoryFormMode === 'create'
                    ? 'Tambah Kategori'
                    : 'Edit Kategori'
            "
            :subtitle="
                categoryFormMode === 'create'
                    ? `Kategori ${categoryForm.type === 'EXPENSE' ? 'pengeluaran' : 'pemasukan'} baru`
                    : 'Perbarui informasi kategori'
            "
        >
            <div class="space-y-4">
                <!-- Name -->
                <div>
                    <label
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block"
                    >
                        Nama Kategori
                    </label>
                    <input
                        v-model="categoryForm.name"
                        type="text"
                        class="input"
                        placeholder="contoh: Makanan, Transport, Gaji"
                    />
                </div>

                <!-- Icon -->
                <div>
                    <label
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block"
                    >
                        Pilih Ikon
                    </label>
                    <div
                        class="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
                    >
                        <button
                            v-for="ic in categoryIcons"
                            :key="ic"
                            class="aspect-square rounded-xl flex items-center justify-center text-lg border-2 transition-all duration-150 active:scale-90"
                            :class="
                                categoryForm.icon === ic
                                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/40'
                                    : 'border-transparent hover:bg-white dark:hover:bg-gray-800'
                            "
                            @click="categoryForm.icon = ic"
                        >
                            {{ ic }}
                        </button>
                    </div>
                </div>

                <!-- Color -->
                <div>
                    <label
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block"
                    >
                        Pilih Warna
                    </label>
                    <div class="grid grid-cols-7 sm:grid-cols-11 gap-2 p-1">
                        <button
                            v-for="c in categoryColors"
                            :key="c"
                            class="aspect-square rounded-full border-2 transition-all duration-150 active:scale-90 shadow-sm"
                            :class="
                                categoryForm.color === c
                                    ? 'border-gray-800 dark:border-white scale-110 shadow-md'
                                    : 'border-transparent'
                            "
                            :style="{ backgroundColor: c }"
                            @click="categoryForm.color = c"
                        />
                    </div>
                </div>

                <!-- Default Checkbox -->
                <div
                    class="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                >
                    <div class="flex items-center gap-3">
                        <span class="text-xl">⭐</span>
                        <div>
                            <p
                                class="text-sm font-bold text-gray-800 dark:text-gray-100"
                            >
                                Kategori Default
                            </p>
                            <p class="text-[10px] text-gray-400">
                                Gunakan sebagai pilihan otomatis untuk
                                {{
                                    categoryForm.type === "EXPENSE"
                                        ? "pengeluaran"
                                        : "pemasukan"
                                }}
                            </p>
                        </div>
                    </div>
                    <input
                        v-model="categoryForm.isDefault"
                        type="checkbox"
                        class="w-6 h-6 rounded-lg text-primary-500 border-gray-300 focus:ring-primary-500"
                    />
                </div>
            </div>

            <template #footer>
                <button
                    class="btn-primary w-full flex items-center justify-center gap-2"
                    :disabled="!categoryForm.name.trim() || categorySaving"
                    @click="saveCategory"
                >
                    <svg
                        v-if="categorySaving"
                        class="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        />
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    {{
                        categoryFormMode === "create"
                            ? "Tambah Kategori"
                            : "Simpan Perubahan"
                    }}
                </button>
            </template>
        </BottomSheet>

        <!-- ── Budget Form ─────────────────────────────────────────── -->
        <BottomSheet
            v-model="showBudgetForm"
            :title="budgetFormMode === 'create' ? 'Atur Budget' : 'Edit Budget'"
            :subtitle="budgetPeriodLabel"
        >
            <div class="space-y-4">
                <!-- Category (only for create) -->
                <div v-if="budgetFormMode === 'create'">
                    <label
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block"
                    >
                        Kategori Pengeluaran
                    </label>
                    <div class="space-y-2 max-h-40 overflow-y-auto">
                        <button
                            v-for="cat in budgetData.availableCategories"
                            :key="cat.id"
                            class="w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-150 active:scale-[0.98] text-left"
                            :class="
                                budgetForm.categoryId === cat.id
                                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/40'
                                    : 'border-gray-100 dark:border-gray-800'
                            "
                            @click="budgetForm.categoryId = cat.id"
                        >
                            <span
                                class="flex items-center justify-center w-8 h-8 rounded-lg text-base"
                                :style="{ backgroundColor: cat.color + '20' }"
                            >
                                {{ cat.icon }}
                            </span>
                            <span
                                class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                            >
                                {{ cat.name }}
                            </span>
                            <span
                                v-if="budgetForm.categoryId === cat.id"
                                class="ml-auto text-primary-500 text-sm font-bold"
                                >✓</span
                            >
                        </button>
                    </div>
                    <p
                        v-if="budgetData.availableCategories.length === 0"
                        class="text-xs text-gray-400 italic py-2"
                    >
                        Semua kategori pengeluaran sudah memiliki budget
                    </p>
                </div>

                <!-- Amount -->
                <div>
                    <label
                        class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block"
                    >
                        Nominal Budget
                    </label>
                    <div class="relative">
                        <span
                            class="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400"
                            >Rp</span
                        >
                        <input
                            :value="budgetAmountDisplay"
                            type="text"
                            inputmode="numeric"
                            class="input pl-10 text-lg font-bold"
                            placeholder="0"
                            @input="onBudgetAmountInput"
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <button
                    class="btn-primary w-full flex items-center justify-center gap-2"
                    :disabled="
                        (budgetFormMode === 'create' &&
                            !budgetForm.categoryId) ||
                        budgetForm.amount <= 0 ||
                        budgetSaving
                    "
                    @click="saveBudget"
                >
                    <svg
                        v-if="budgetSaving"
                        class="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                        />
                        <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                    </svg>
                    {{
                        budgetFormMode === "create"
                            ? "Simpan Budget"
                            : "Perbarui Budget"
                    }}
                </button>
            </template>
        </BottomSheet>

        <!-- ── Confirm Dialogs ─────────────────────────────────────── -->
        <ConfirmDialog
            v-model="showDeleteWallet"
            title="Hapus Dompet?"
            :message="`${walletToDelete?.name ?? 'Dompet'} akan dihapus permanen.`"
            confirm-text="Ya, Hapus"
            cancel-text="Batal"
            variant="danger"
            icon="🗑️"
            :loading="walletDeleting"
            @confirm="deleteWallet"
        />

        <ConfirmDialog
            v-model="showDeleteCategory"
            title="Hapus Kategori?"
            :message="`${categoryToDelete?.name ?? 'Kategori'} akan dihapus permanen.`"
            confirm-text="Ya, Hapus"
            cancel-text="Batal"
            variant="danger"
            icon="🗑️"
            :loading="categoryDeleting"
            @confirm="deleteCategory"
        />

        <ConfirmDialog
            v-model="showDeleteBudget"
            title="Hapus Budget?"
            :message="`Budget untuk ${budgetToDelete?.category ?? 'kategori'} akan dihapus.`"
            confirm-text="Ya, Hapus"
            cancel-text="Batal"
            variant="danger"
            icon="🗑️"
            :loading="budgetDeleting"
            @confirm="deleteBudget"
        />

        <!-- ── Toast ───────────────────────────────────────────────── -->
        <Toast
            v-model="toast.show"
            :message="toast.message"
            :type="toast.type"
        />
    </div>
</template>

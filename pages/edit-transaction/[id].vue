<script setup lang="ts">
// pages/edit-transaction/[id].vue — Edit existing transaction

const route = useRoute();
const router = useRouter();
const { formatIDR } = useCurrency();

const txId = computed(() => route.params.id as string);

useHead({ title: "Edit Transaksi — CashPlow" });

// ── Toast ─────────────────────────────────────────────────────
const toast = reactive({
    show: false,
    message: "",
    type: "success" as "success" | "error",
});

// ── Fetch existing transaction ───────────────────────────────
const { data: txRaw, status: txStatus } = await useFetch<any>(
    () => `/api/transactions/${txId.value}`,
    { key: `edit-tx-${txId.value}` },
);

const txData = computed(() => txRaw.value?.data);
const pageLoading = computed(() => txStatus.value === "pending");

// ── Fetch wallets & categories ───────────────────────────────
const { data: walletsRaw } = await useFetch("/api/wallets", {
    key: "edit-tx-wallets",
});
const { data: categoriesRaw } = await useFetch("/api/categories", {
    key: "edit-tx-categories",
});

const wallets = computed(() => walletsRaw.value?.data ?? []);
const allCategories = computed(() => categoriesRaw.value?.data ?? []);

// ── Transaction type ─────────────────────────────────────────
const txType = ref<"EXPENSE" | "INCOME" | "TRANSFER">("EXPENSE");

const typeOptions = [
    {
        value: "EXPENSE" as const,
        label: "Pengeluaran",
        icon: "💸",
        color: "rose",
    },
    {
        value: "INCOME" as const,
        label: "Pemasukan",
        icon: "💰",
        color: "emerald",
    },
    {
        value: "TRANSFER" as const,
        label: "Transfer",
        icon: "🔄",
        color: "blue",
    },
];

// Filter categories by type
const filteredCategories = computed(() => {
    if (txType.value === "TRANSFER") {
        return allCategories.value.filter((c: any) => c.type === "EXPENSE");
    }
    const catType = txType.value === "INCOME" ? "INCOME" : "EXPENSE";
    return allCategories.value.filter((c: any) => c.type === catType);
});

// ── Form state ───────────────────────────────────────────────
const form = reactive({
    amount: 0,
    categoryId: "",
    walletFromId: "",
    walletToId: "",
    description: "",
    notes: "",
    date: "",
    // Detail Fields
    quantity: 1,
    unitPrice: 0,
    // Promo Fields
    isPromo: false,
    promoType: "PERCENTAGE" as "PERCENTAGE" | "FIXED" | "BUY_X_GET_Y",
    promoValue: 0,
    promoDetails: "",
});

// Auto-calculate amount for EXPENSE
watch(
    [
        () => form.quantity,
        () => form.unitPrice,
        () => form.isPromo,
        () => form.promoType,
        () => form.promoValue,
    ],
    ([qty, price, isPromo, pType, pValue]) => {
        if (txType.value === "EXPENSE" && formInitialized.value) {
            let total = qty * price;

            if (isPromo) {
                if (pType === "PERCENTAGE") {
                    total = total - total * (pValue / 100);
                } else if (pType === "FIXED") {
                    total = Math.max(0, total - pValue);
                }
            }

            form.amount = Math.round(total);
            amountDisplay.value =
                form.amount > 0 ? form.amount.toLocaleString("id-ID") : "";
        }
    },
);

const savingsAmount = computed(() => {
    if (!form.isPromo || txType.value !== "EXPENSE") return 0;
    const baseTotal = form.quantity * form.unitPrice;
    if (form.promoType === "PERCENTAGE") {
        return baseTotal * (form.promoValue / 100);
    } else if (form.promoType === "FIXED") {
        return Math.min(baseTotal, form.promoValue);
    }
    return 0;
});

const promoTypeOptions = [
    { value: "PERCENTAGE", label: "Diskon %", icon: "🏷️" },
    { value: "FIXED", label: "Potongan Harga", icon: "💸" },
    { value: "BUY_X_GET_Y", label: "Buy X Get Y", icon: "🎁" },
] as const;

const promoValueDisplay = ref("");
const onPromoValueInput = (e: Event) => {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
    const num = parseInt(raw) || 0;
    form.promoValue = num;
    promoValueDisplay.value = num > 0 ? num.toLocaleString("id-ID") : "";
};

const unitPriceDisplay = ref("");
const onUnitPriceInput = (e: Event) => {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
    const num = parseInt(raw) || 0;
    form.unitPrice = num;
    unitPriceDisplay.value = num > 0 ? num.toLocaleString("id-ID") : "";
};

const saving = ref(false);
const formInitialized = ref(false);

// ── Amount input (declared early for watch) ──────────────────
const amountDisplay = ref("");

const onAmountInput = (e: Event) => {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
    const num = parseInt(raw) || 0;
    form.amount = num;
    amountDisplay.value = num > 0 ? num.toLocaleString("id-ID") : "";
};

// ── Initialize form from fetched data ────────────────────────
watch(
    txData,
    (data) => {
        if (data && !formInitialized.value) {
            txType.value = data.type as typeof txType.value;
            form.amount = data.amount;
            form.categoryId = data.category.id; // Note: API returns category object
            form.walletFromId = data.walletFrom?.id ?? "";
            form.walletToId = data.walletTo?.id ?? "";
            form.description = data.description ?? "";
            form.notes = data.notes ?? "";
            form.date = data.date
                ? new Date(data.date).toISOString().split("T")[0] || ""
                : "";

            // Detail fields
            form.quantity = data.quantity ?? 1;
            form.unitPrice = data.unitPrice ?? 0;
            unitPriceDisplay.value =
                form.unitPrice > 0
                    ? form.unitPrice.toLocaleString("id-ID")
                    : "";

            // Promo fields
            form.isPromo = data.isPromo ?? false;
            form.promoType = data.promoType ?? "PERCENTAGE";
            form.promoValue = data.promoValue ?? 0;
            promoValueDisplay.value =
                form.promoValue > 0
                    ? form.promoValue.toLocaleString("id-ID")
                    : "";
            form.promoDetails = data.promoDetails ?? "";

            // Set amount display
            amountDisplay.value =
                data.amount > 0 ? data.amount.toLocaleString("id-ID") : "";
            formInitialized.value = true;
        }
    },
    { immediate: true },
);

// Reset form when type changes (but only after initial load)
watch(txType, (newType) => {
    if (formInitialized.value) {
        // If we switch back to the original type from DB, restore its values
        if (newType === txData.value?.type) {
            const data = txData.value;
            form.amount = data.amount;
            form.categoryId = data.category.id;
            form.walletFromId = data.walletFrom?.id ?? "";
            form.walletToId = data.walletTo?.id ?? "";
            form.description = data.description ?? "";
            form.notes = data.notes ?? "";
            form.quantity = data.quantity ?? 1;
            form.unitPrice = data.unitPrice ?? 0;
            form.isPromo = data.isPromo ?? false;
            form.promoType = data.promoType ?? "PERCENTAGE";
            form.promoValue = data.promoValue ?? 0;
            form.promoDetails = data.promoDetails ?? "";
        } else {
            // Clear for other types to avoid leakage
            form.amount = 0;
            form.categoryId = "";
            form.walletFromId = "";
            form.walletToId = "";
            form.description = "";
            form.notes = "";
            form.quantity = 1;
            form.unitPrice = 0;
            form.isPromo = false;
            form.promoValue = 0;
            form.promoDetails = "";
        }

        // Reset displays
        amountDisplay.value =
            form.amount > 0 ? form.amount.toLocaleString("id-ID") : "";
        unitPriceDisplay.value =
            form.unitPrice > 0 ? form.unitPrice.toLocaleString("id-ID") : "";
        promoValueDisplay.value =
            form.promoValue > 0 ? form.promoValue.toLocaleString("id-ID") : "";
    }
});

// ── Pickers ─────────────────────────────────────────────────
const showCategoryPicker = ref(false);
const showWalletFromPicker = ref(false);
const showWalletToPicker = ref(false);

const selectedCategory = computed(() =>
    allCategories.value.find((c: any) => c.id === form.categoryId),
);
const selectedWalletFrom = computed(() =>
    wallets.value.find((w: any) => w.id === form.walletFromId),
);
const selectedWalletTo = computed(() =>
    wallets.value.find((w: any) => w.id === form.walletToId),
);

const walletTypeIcon = (type: string) => {
    const map: Record<string, string> = {
        CASH: "💵",
        BANK: "🏦",
        E_WALLET: "📱",
        INVESTMENT: "📈",
        OTHER: "💳",
    };
    return map[type] ?? "💳";
};

// ── Validation ───────────────────────────────────────────────
const isBalanceInsufficient = computed(() => {
    if (txType.value === "EXPENSE" || txType.value === "TRANSFER") {
        if (selectedWalletFrom.value && form.amount > 0) {
            let availableBalance = Number(selectedWalletFrom.value.balance);

            // If editing the same wallet, the real available balance includes the original amount
            if (
                txData.value &&
                txData.value.walletFrom?.id === selectedWalletFrom.value.id
            ) {
                availableBalance += Number(txData.value.amount);
            }

            return form.amount > availableBalance;
        }
    }
    return false;
});

const canSubmit = computed(() => {
    if (form.amount <= 0 || !form.categoryId) return false;
    if (txType.value === "EXPENSE" && !form.walletFromId) return false;
    if (txType.value === "INCOME" && !form.walletToId) return false;
    if (txType.value === "TRANSFER" && (!form.walletFromId || !form.walletToId))
        return false;
    if (isBalanceInsufficient.value) return false;
    return true;
});

// ── Has changes ──────────────────────────────────────────────
const hasChanges = computed(() => {
    if (!txData.value) return false;
    const d = txData.value;
    return (
        form.amount !== d.amount ||
        txType.value !== d.type ||
        form.categoryId !== d.category.id ||
        form.walletFromId !== (d.walletFrom?.id ?? "") ||
        form.walletToId !== (d.walletTo?.id ?? "") ||
        form.description !== (d.description ?? "") ||
        form.notes !== (d.notes ?? "") ||
        form.date !==
            (d.date ? new Date(d.date).toISOString().split("T")[0] : "") ||
        form.quantity !== (d.quantity ?? 1) ||
        form.unitPrice !== (d.unitPrice ?? 0) ||
        form.isPromo !== (d.isPromo ?? false) ||
        (form.isPromo &&
            (form.promoType !== (d.promoType ?? "PERCENTAGE") ||
                form.promoValue !== (d.promoValue ?? 0) ||
                form.promoDetails !== (d.promoDetails ?? "")))
    );
});

// ── Submit ───────────────────────────────────────────────────
const submit = async () => {
    if (!canSubmit.value || saving.value || !hasChanges.value) return;
    saving.value = true;

    try {
        await $fetch(`/api/transactions/${txId.value}`, {
            method: "PUT",
            body: {
                amount: form.amount,
                type: txType.value,
                categoryId: form.categoryId,
                walletFromId: form.walletFromId || null,
                walletToId: form.walletToId || null,
                description: form.description || undefined,
                notes: form.notes || undefined,
                date: form.date ? new Date(form.date).toISOString() : undefined,
                // Detail fields
                quantity:
                    txType.value === "EXPENSE" ? form.quantity : undefined,
                unitPrice:
                    txType.value === "EXPENSE" ? form.unitPrice : undefined,
                // Promo fields
                isPromo: form.isPromo,
                promoType: form.isPromo ? form.promoType : undefined,
                promoValue:
                    form.isPromo && form.promoType !== "BUY_X_GET_Y"
                        ? form.promoValue
                        : undefined,
                promoDetails:
                    form.isPromo && form.promoType === "BUY_X_GET_Y"
                        ? form.promoDetails
                        : undefined,
            },
        });

        toast.message = "Transaksi berhasil diperbarui! ✅";
        toast.type = "success";
        toast.show = true;

        setTimeout(() => {
            router.push("/transactions");
        }, 800);
    } catch (err: any) {
        toast.message = err?.data?.message ?? "Gagal memperbarui transaksi";
        toast.type = "error";
        toast.show = true;
        saving.value = false;
    }
};
</script>

<template>
    <div class="space-y-4 animate-fade-in">
        <!-- ── Header ────────────────────────────────────────────── -->
        <div class="flex items-center gap-3">
            <button class="btn-icon w-9 h-9" @click="router.back()">
                <svg
                    class="w-5 h-5"
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
            <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Edit Transaksi
                </h2>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                    Perbarui data transaksi
                </p>
            </div>
        </div>

        <!-- ── Loading skeleton ──────────────────────────────────── -->
        <template v-if="pageLoading">
            <div class="space-y-4">
                <div
                    class="h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
                <div
                    class="h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
                <div
                    class="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
                <div
                    class="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
                <div
                    class="h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                />
            </div>
        </template>

        <!-- ── Not found ─────────────────────────────────────────── -->
        <div v-else-if="!txData" class="card rounded-2xl p-10 text-center">
            <span class="text-4xl">😵</span>
            <p
                class="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-3"
            >
                Transaksi tidak ditemukan
            </p>
            <NuxtLink
                to="/transactions"
                class="text-sm font-semibold text-primary-500 mt-2 inline-block"
            >
                ← Kembali ke riwayat
            </NuxtLink>
        </div>

        <!-- ── Edit form ─────────────────────────────────────────── -->
        <template v-else>
            <!-- Type Selector -->
            <div
                class="flex gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/60"
            >
                <button
                    v-for="opt in typeOptions"
                    :key="opt.value"
                    class="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95"
                    :class="
                        txType === opt.value
                            ? `bg-white dark:bg-surface-900 shadow-card ${
                                  opt.color === 'rose'
                                      ? 'text-rose-500'
                                      : opt.color === 'emerald'
                                        ? 'text-emerald-500'
                                        : 'text-blue-500'
                              }`
                            : 'text-gray-400 dark:text-gray-500'
                    "
                    @click="txType = opt.value"
                >
                    <span class="text-sm">{{ opt.icon }}</span>
                    <span>{{ opt.label }}</span>
                </button>
            </div>

            <!-- ── FORM FIELDS (Dynamic based on Type) ───────────────────── -->
            <div class="space-y-4">
                <!-- 1. PENGELUARAN ──────── -->
                <template v-if="txType === 'EXPENSE'">
                    <!-- Nama Produk -->
                    <div class="card rounded-2xl p-4">
                        <label
                            class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 block"
                            >📦 Nama Produk / Item</label
                        >
                        <input
                            v-model="form.description"
                            type="text"
                            class="input"
                            placeholder="misal: Indomie Goreng"
                        />
                    </div>

                    <!-- Tanggal -->
                    <div class="card rounded-2xl p-4">
                        <label
                            class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                            >📅 Tanggal</label
                        >
                        <input v-model="form.date" type="date" class="input" />
                    </div>

                    <!-- Kategori -->
                    <button
                        class="w-full card rounded-2xl p-4 flex items-center gap-3 text-left"
                        @click="showCategoryPicker = true"
                    >
                        <span
                            v-if="selectedCategory"
                            class="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
                            :style="{
                                backgroundColor: selectedCategory.color + '20',
                            }"
                            >{{ selectedCategory.icon }}</span
                        >
                        <span
                            v-else
                            class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg"
                            >🏷️</span
                        >
                        <div class="flex-1">
                            <p
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                            >
                                Kategori
                            </p>
                            <p
                                class="text-sm font-bold"
                                :class="
                                    selectedCategory
                                        ? 'text-gray-800 dark:text-gray-100'
                                        : 'text-gray-400'
                                "
                            >
                                {{ selectedCategory?.name ?? "Pilih kategori" }}
                            </p>
                        </div>
                        <svg
                            class="w-4 h-4 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    <!-- Qty & Unit Price -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="card rounded-2xl p-4">
                            <label
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                                >🔢 Jumlah (Qty)</label
                            >
                            <input
                                v-model.number="form.quantity"
                                type="number"
                                min="1"
                                class="input text-center font-bold"
                            />
                        </div>
                        <div class="card rounded-2xl p-4">
                            <label
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                                >💰 Harga Satuan</label
                            >
                            <div class="relative flex items-center">
                                <span
                                    class="absolute left-3 font-bold text-gray-400 text-sm"
                                    >Rp</span
                                >
                                <input
                                    :value="unitPriceDisplay"
                                    type="text"
                                    inputmode="numeric"
                                    class="input pl-10 pr-3 text-right font-bold"
                                    placeholder="0"
                                    @input="onUnitPriceInput"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Promo Section -->
                    <div class="card rounded-2xl p-4 space-y-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <span class="text-lg">🏷️</span>
                                <label
                                    class="text-sm font-bold text-gray-800 dark:text-gray-100 cursor-pointer"
                                    for="isPromoEdit"
                                    >Gunakan Promo</label
                                >
                            </div>
                            <input
                                id="isPromoEdit"
                                v-model="form.isPromo"
                                type="checkbox"
                                class="w-5 h-5 rounded-lg text-rose-500"
                            />
                        </div>
                        <div
                            v-if="form.isPromo"
                            class="space-y-3 animate-slide-up pt-2 border-t border-gray-50 dark:border-gray-800/50"
                        >
                            <div
                                class="flex gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-gray-800/60"
                            >
                                <button
                                    v-for="opt in promoTypeOptions"
                                    :key="opt.value"
                                    type="button"
                                    class="flex-1 py-1.5 rounded-lg text-[10px] font-bold"
                                    :class="
                                        form.promoType === opt.value
                                            ? 'bg-white dark:bg-surface-900 shadow-sm text-rose-500'
                                            : 'text-gray-400'
                                    "
                                    @click="form.promoType = opt.value"
                                >
                                    {{ opt.label }}
                                </button>
                            </div>
                            <div
                                v-if="form.promoType === 'PERCENTAGE'"
                                class="relative flex items-center"
                            >
                                <input
                                    v-model.number="form.promoValue"
                                    type="number"
                                    class="input px-4 text-center font-bold"
                                    placeholder="0"
                                />
                                <span
                                    class="absolute right-4 font-bold text-gray-400"
                                    >%</span
                                >
                            </div>
                            <div
                                v-if="form.promoType === 'FIXED'"
                                class="relative flex items-center"
                            >
                                <span
                                    class="absolute left-4 font-bold text-gray-400"
                                    >Rp</span
                                >
                                <input
                                    :value="promoValueDisplay"
                                    type="text"
                                    inputmode="numeric"
                                    class="input pl-11 pr-4 text-center font-bold"
                                    placeholder="0"
                                    @input="onPromoValueInput"
                                />
                            </div>
                            <input
                                v-if="form.promoType === 'BUY_X_GET_Y'"
                                v-model="form.promoDetails"
                                type="text"
                                class="input px-4"
                                placeholder="contoh: Beli 1 Gratis 1"
                            />

                            <!-- Savings Message -->
                            <p
                                v-if="savingsAmount > 0"
                                class="text-[11px] font-bold text-emerald-500 flex items-center gap-1 mt-1 animate-pulse"
                            >
                                ✨ Anda sudah menghemat
                                {{ formatIDR(savingsAmount) }}!
                            </p>
                        </div>
                    </div>
                    <!-- Sumber Dana -->
                    <button
                        class="w-full card rounded-2xl p-4 flex items-center gap-3 text-left"
                        @click="showWalletFromPicker = true"
                    >
                        <span
                            v-if="selectedWalletFrom"
                            class="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
                            :style="{
                                backgroundColor:
                                    selectedWalletFrom.color + '20',
                            }"
                            >{{ walletTypeIcon(selectedWalletFrom.type) }}</span
                        >
                        <span
                            v-else
                            class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg"
                            >👛</span
                        >
                        <div class="flex-1">
                            <p
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                            >
                                Sumber Dana
                            </p>
                            <p
                                class="text-sm font-bold"
                                :class="
                                    selectedWalletFrom
                                        ? 'text-gray-800 dark:text-gray-100'
                                        : 'text-gray-400'
                                "
                            >
                                {{ selectedWalletFrom?.name ?? "Pilih dompet" }}
                            </p>
                        </div>
                        <svg
                            class="w-4 h-4 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>
                    <!-- Warning Insufficient Balance -->
                    <div
                        v-if="isBalanceInsufficient"
                        class="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50"
                    >
                        <span class="text-amber-500 text-lg">⚠️</span>
                        <div class="flex-1">
                            <p
                                class="text-xs font-bold text-amber-800 dark:text-amber-400"
                            >
                                Saldo Tidak Cukup
                            </p>
                            <p
                                class="text-[11px] text-amber-700/80 dark:text-amber-500/80 mt-0.5"
                            >
                                Saldo di {{ selectedWalletFrom?.name }} saat ini
                                tidak mencukupi untuk transaksi ini.
                            </p>
                        </div>
                    </div>
                    <!-- Keterangan -->
                    <div class="card rounded-2xl p-4">
                        <label
                            class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                            >💬 Catatan (opsional)</label
                        >
                        <textarea
                            v-model="form.notes"
                            class="input resize-none"
                            rows="2"
                            placeholder="Keterangan tambahan..."
                        ></textarea>
                    </div>

                    <!-- Total Nominal -->
                    <div
                        class="card rounded-2xl p-6 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-surface-900 text-center border-2 border-rose-100 dark:border-rose-900/30"
                    >
                        <p
                            class="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1"
                        >
                            Total Nominal
                        </p>
                        <div class="flex items-center justify-center gap-1">
                            <span class="text-lg font-bold text-rose-400"
                                >Rp</span
                            >
                            <input
                                :value="amountDisplay"
                                type="text"
                                readonly
                                class="text-3xl font-black text-rose-500 bg-transparent border-none outline-none w-full max-w-[200px] text-center"
                            />
                        </div>
                    </div>
                </template>

                <!-- 2. PEMASUKAN ──────── -->
                <template v-else-if="txType === 'INCOME'">
                    <!-- Nama Pemasukan -->
                    <div class="card rounded-2xl p-4">
                        <label
                            class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                            >💼 Nama Pemasukan</label
                        >
                        <input
                            v-model="form.description"
                            type="text"
                            class="input"
                            placeholder="misal: Gaji Bulanan"
                        />
                    </div>

                    <!-- Tanggal -->
                    <div class="card rounded-2xl p-4">
                        <label
                            class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                            >📅 Tanggal</label
                        >
                        <input v-model="form.date" type="date" class="input" />
                    </div>

                    <!-- Kategori -->
                    <button
                        class="w-full card rounded-2xl p-4 flex items-center gap-3 text-left"
                        @click="showCategoryPicker = true"
                    >
                        <span
                            v-if="selectedCategory"
                            class="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
                            :style="{
                                backgroundColor: selectedCategory.color + '20',
                            }"
                            >{{ selectedCategory.icon }}</span
                        >
                        <span
                            v-else
                            class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg"
                            >🏷️</span
                        >
                        <div class="flex-1">
                            <p
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                            >
                                Kategori
                            </p>
                            <p
                                class="text-sm font-bold"
                                :class="
                                    selectedCategory
                                        ? 'text-gray-800 dark:text-gray-100'
                                        : 'text-gray-400'
                                "
                            >
                                {{ selectedCategory?.name ?? "Pilih kategori" }}
                            </p>
                        </div>
                        <svg
                            class="w-4 h-4 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    <!-- Tujuan Dana -->
                    <button
                        class="w-full card rounded-2xl p-4 flex items-center gap-3 text-left"
                        @click="showWalletToPicker = true"
                    >
                        <span
                            v-if="selectedWalletTo"
                            class="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
                            :style="{
                                backgroundColor: selectedWalletTo.color + '20',
                            }"
                            >{{ walletTypeIcon(selectedWalletTo.type) }}</span
                        >
                        <span
                            v-else
                            class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg"
                            >👛</span
                        >
                        <div class="flex-1">
                            <p
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                            >
                                Tujuan Dana
                            </p>
                            <p
                                class="text-sm font-bold"
                                :class="
                                    selectedWalletTo
                                        ? 'text-gray-800 dark:text-gray-100'
                                        : 'text-gray-400'
                                "
                            >
                                {{ selectedWalletTo?.name ?? "Pilih dompet" }}
                            </p>
                        </div>
                        <svg
                            class="w-4 h-4 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    <!-- Keterangan -->
                    <div class="card rounded-2xl p-4">
                        <label
                            class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                            >💬 Keterangan</label
                        >
                        <textarea
                            v-model="form.notes"
                            class="input resize-none"
                            rows="2"
                            placeholder="Catatan tambahan..."
                        ></textarea>
                    </div>

                    <!-- Jumlah Pemasukan -->
                    <div
                        class="card rounded-2xl p-6 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-surface-900 text-center border-2 border-emerald-100 dark:border-emerald-900/30"
                    >
                        <p
                            class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1"
                        >
                            Jumlah Pemasukan
                        </p>
                        <div class="flex items-center justify-center gap-1">
                            <span class="text-lg font-bold text-emerald-400"
                                >Rp</span
                            >
                            <input
                                :value="amountDisplay"
                                type="text"
                                inputmode="numeric"
                                class="text-3xl font-black text-emerald-500 bg-transparent border-none outline-none w-full max-w-[240px] text-center"
                                placeholder="0"
                                @input="onAmountInput"
                            />
                        </div>
                    </div>
                </template>

                <!-- 3. TRANSFER ──────── -->
                <template v-else-if="txType === 'TRANSFER'">
                    <!-- Tanggal -->
                    <div class="card rounded-2xl p-4">
                        <label
                            class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                            >📅 Tanggal</label
                        >
                        <input v-model="form.date" type="date" class="input" />
                    </div>

                    <!-- Kategori -->
                    <button
                        class="w-full card rounded-2xl p-4 flex items-center gap-3 text-left"
                        @click="showCategoryPicker = true"
                    >
                        <span
                            v-if="selectedCategory"
                            class="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
                            :style="{
                                backgroundColor: selectedCategory.color + '20',
                            }"
                            >{{ selectedCategory.icon }}</span
                        >
                        <span
                            v-else
                            class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg"
                            >🏷️</span
                        >
                        <div class="flex-1">
                            <p
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                            >
                                Kategori
                            </p>
                            <p
                                class="text-sm font-bold"
                                :class="
                                    selectedCategory
                                        ? 'text-gray-800 dark:text-gray-100'
                                        : 'text-gray-400'
                                "
                            >
                                {{ selectedCategory?.name ?? "Pilih kategori" }}
                            </p>
                        </div>
                        <svg
                            class="w-4 h-4 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    <!-- Dana Asal -->
                    <button
                        class="w-full card rounded-2xl p-4 flex items-center gap-3 text-left"
                        @click="showWalletFromPicker = true"
                    >
                        <span
                            v-if="selectedWalletFrom"
                            class="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
                            :style="{
                                backgroundColor:
                                    selectedWalletFrom.color + '20',
                            }"
                            >{{ walletTypeIcon(selectedWalletFrom.type) }}</span
                        >
                        <span
                            v-else
                            class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg"
                            >👛</span
                        >
                        <div class="flex-1">
                            <p
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                            >
                                Dana Asal
                            </p>
                            <p
                                class="text-sm font-bold"
                                :class="
                                    selectedWalletFrom
                                        ? 'text-gray-800 dark:text-gray-100'
                                        : 'text-gray-400'
                                "
                            >
                                {{
                                    selectedWalletFrom?.name ??
                                    "Pilih dompet asal"
                                }}
                            </p>
                        </div>
                        <svg
                            class="w-4 h-4 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    <!-- Dana Tujuan -->
                    <button
                        class="w-full card rounded-2xl p-4 flex items-center gap-3 text-left"
                        @click="showWalletToPicker = true"
                    >
                        <span
                            v-if="selectedWalletTo"
                            class="flex items-center justify-center w-10 h-10 rounded-xl text-lg"
                            :style="{
                                backgroundColor: selectedWalletTo.color + '20',
                            }"
                            >{{ walletTypeIcon(selectedWalletTo.type) }}</span
                        >
                        <span
                            v-else
                            class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg"
                            >👛</span
                        >
                        <div class="flex-1">
                            <p
                                class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                            >
                                Dana Tujuan
                            </p>
                            <p
                                class="text-sm font-bold"
                                :class="
                                    selectedWalletTo
                                        ? 'text-gray-800 dark:text-gray-100'
                                        : 'text-gray-400'
                                "
                            >
                                {{
                                    selectedWalletTo?.name ??
                                    "Pilih dompet tujuan"
                                }}
                            </p>
                        </div>
                        <svg
                            class="w-4 h-4 text-gray-300"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>

                    <!-- Nominal Transfer -->
                    <div
                        class="card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-surface-900 text-center border-2 border-blue-100 dark:border-blue-900/30"
                    >
                        <p
                            class="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1"
                        >
                            Nominal Transfer
                        </p>
                        <div class="flex items-center justify-center gap-1">
                            <span class="text-lg font-bold text-blue-400"
                                >Rp</span
                            >
                            <input
                                :value="amountDisplay"
                                type="text"
                                inputmode="numeric"
                                class="text-3xl font-black text-blue-500 bg-transparent border-none outline-none w-full max-w-[240px] text-center"
                                placeholder="0"
                                @input="onAmountInput"
                            />
                        </div>
                    </div>
                    <!-- Warning Insufficient Balance -->
                    <div
                        v-if="isBalanceInsufficient"
                        class="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50"
                    >
                        <span class="text-amber-500 text-lg">⚠️</span>
                        <div class="flex-1">
                            <p
                                class="text-xs font-bold text-amber-800 dark:text-amber-400"
                            >
                                Saldo Tidak Cukup
                            </p>
                            <p
                                class="text-[11px] text-amber-700/80 dark:text-amber-500/80 mt-0.5"
                            >
                                Saldo di {{ selectedWalletFrom?.name }} saat ini
                                tidak mencukupi untuk transaksi ini.
                            </p>
                        </div>
                    </div>
                    <!-- Warning Insufficient Balance -->
                    <div
                        v-if="isBalanceInsufficient"
                        class="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50"
                    >
                        <span class="text-amber-500 text-lg">⚠️</span>
                        <div class="flex-1">
                            <p
                                class="text-xs font-bold text-amber-800 dark:text-amber-400"
                            >
                                Saldo Tidak Cukup
                            </p>
                            <p
                                class="text-[11px] text-amber-700/80 dark:text-amber-500/80 mt-0.5"
                            >
                                Saldo di {{ selectedWalletFrom?.name }} saat ini
                                tidak mencukupi untuk transaksi ini.
                            </p>
                        </div>
                    </div>
                    <!-- Keterangan -->
                    <div class="card rounded-2xl p-4">
                        <label
                            class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block"
                            >💬 Keterangan</label
                        >
                        <textarea
                            v-model="form.notes"
                            class="input resize-none"
                            rows="2"
                            placeholder="Catatan transfer..."
                        ></textarea>
                    </div>
                </template>
            </div>

            <!-- Changes indicator -->
            <div
                v-if="hasChanges"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50"
            >
                <span class="text-sm">✏️</span>
                <span
                    class="text-xs font-semibold text-amber-600 dark:text-amber-400"
                >
                    Ada perubahan yang belum disimpan
                </span>
            </div>

            <!-- Submit Button -->
            <button
                class="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="
                    txType === 'EXPENSE'
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30'
                        : txType === 'INCOME'
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
                "
                :disabled="!canSubmit || saving || !hasChanges"
                @click="submit"
            >
                <svg
                    v-if="saving"
                    class="w-5 h-5 animate-spin"
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
                <span>{{ saving ? "Menyimpan..." : "Simpan Perubahan" }}</span>
            </button>

            <div class="h-4" />
        </template>

        <!-- ══════════════════════════════════════════════════════════
         PICKERS
    ══════════════════════════════════════════════════════════ -->

        <!-- Category Picker -->
        <BottomSheet
            v-model="showCategoryPicker"
            title="Pilih Kategori"
            :subtitle="
                txType === 'EXPENSE'
                    ? 'Kategori pengeluaran'
                    : txType === 'INCOME'
                      ? 'Kategori pemasukan'
                      : 'Kategori transfer'
            "
        >
            <div class="space-y-1.5">
                <button
                    v-for="cat in filteredCategories"
                    :key="cat.id"
                    class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 active:scale-[0.98] text-left"
                    :class="
                        form.categoryId === cat.id
                            ? 'bg-primary-50 dark:bg-primary-950/30 ring-2 ring-primary-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    "
                    @click="
                        form.categoryId = cat.id;
                        showCategoryPicker = false;
                    "
                >
                    <span
                        class="flex items-center justify-center w-9 h-9 rounded-xl text-base"
                        :style="{ backgroundColor: cat.color + '20' }"
                        >{{ cat.icon }}</span
                    >
                    <span
                        class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1"
                        >{{ cat.name }}</span
                    >
                    <span
                        v-if="form.categoryId === cat.id"
                        class="text-primary-500 font-bold"
                        >✓</span
                    >
                </button>
            </div>
        </BottomSheet>

        <!-- Wallet From Picker -->
        <BottomSheet
            v-model="showWalletFromPicker"
            title="Pilih Dompet Sumber"
            subtitle="Uang keluar dari dompet ini"
        >
            <div class="space-y-1.5">
                <button
                    v-for="w in wallets"
                    :key="w.id"
                    class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 active:scale-[0.98] text-left"
                    :class="
                        form.walletFromId === w.id
                            ? 'bg-primary-50 dark:bg-primary-950/30 ring-2 ring-primary-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    "
                    @click="
                        form.walletFromId = w.id;
                        showWalletFromPicker = false;
                    "
                >
                    <span
                        class="flex items-center justify-center w-9 h-9 rounded-xl text-base"
                        :style="{ backgroundColor: w.color + '20' }"
                        >{{ walletTypeIcon(w.type) }}</span
                    >
                    <div class="flex-1 min-w-0">
                        <p
                            class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ w.name }}
                        </p>
                        <p class="text-[11px] text-gray-400">
                            {{ formatIDR(w.balance) }}
                        </p>
                    </div>
                    <span
                        v-if="form.walletFromId === w.id"
                        class="text-primary-500 font-bold"
                        >✓</span
                    >
                </button>
            </div>
        </BottomSheet>

        <!-- Wallet To Picker -->
        <BottomSheet
            v-model="showWalletToPicker"
            title="Pilih Dompet Tujuan"
            subtitle="Uang masuk ke dompet ini"
        >
            <div class="space-y-1.5">
                <button
                    v-for="w in wallets"
                    :key="w.id"
                    class="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 active:scale-[0.98] text-left"
                    :class="
                        form.walletToId === w.id
                            ? 'bg-primary-50 dark:bg-primary-950/30 ring-2 ring-primary-400'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    "
                    @click="
                        form.walletToId = w.id;
                        showWalletToPicker = false;
                    "
                >
                    <span
                        class="flex items-center justify-center w-9 h-9 rounded-xl text-base"
                        :style="{ backgroundColor: w.color + '20' }"
                        >{{ walletTypeIcon(w.type) }}</span
                    >
                    <div class="flex-1 min-w-0">
                        <p
                            class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ w.name }}
                        </p>
                        <p class="text-[11px] text-gray-400">
                            {{ formatIDR(w.balance) }}
                        </p>
                    </div>
                    <span
                        v-if="form.walletToId === w.id"
                        class="text-primary-500 font-bold"
                        >✓</span
                    >
                </button>
            </div>
        </BottomSheet>

        <!-- Toast -->
        <Toast
            v-model="toast.show"
            :message="toast.message"
            :type="toast.type"
        />
    </div>
</template>

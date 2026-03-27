<script setup lang="ts">
// pages/add-transaction.vue — Phase 4: Add Transaction Form

useHead({ title: "Tambah Transaksi — CashPlow" });

const router = useRouter();
const { formatIDR } = useCurrency();
const isOnline = useOnline();
const { saveOffline } = useOfflineSync();

// ── Toast ─────────────────────────────────────────────────────
const toast = reactive({
    show: false,
    message: "",
    type: "success" as "success" | "error",
});

// ── Transaction type tabs ─────────────────────────────────────
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

// ── Fetch wallets & categories ───────────────────────────────
const { data: walletsRaw } = await useFetch("/api/wallets", {
    key: "tx-wallets",
});
const { data: categoriesRaw } = await useFetch("/api/categories", {
    key: "tx-categories",
});

const wallets = computed(() => walletsRaw.value?.data ?? []);
const allCategories = computed(() => categoriesRaw.value?.data ?? []);

// Filter categories by type
const filteredCategories = computed(() => {
    if (txType.value === "TRANSFER") {
        // For transfer, show expense categories as default
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
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
    // Detail Fields
    quantity: 1,
    unitPrice: 0,
    // Promo Fields
    isPromo: false,
    promoType: "PERCENTAGE" as "PERCENTAGE" | "FIXED" | "BUY_X_GET_Y",
    promoValue: 0,
    promoDetails: "",
    // Recurring Fields
    isRecurring: false,
    recurringInterval: "MONTHLY" as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY",
    recurringEndDate: "",
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
        if (txType.value === "EXPENSE") {
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

// Unit price display logic
const unitPriceDisplay = ref("");
const onUnitPriceInput = (e: Event) => {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
    const num = parseInt(raw) || 0;
    form.unitPrice = num;
    unitPriceDisplay.value = num > 0 ? num.toLocaleString("id-ID") : "";
};

const saving = ref(false);

// Reset form when type changes
watch(txType, () => {
    form.amount = 0;
    amountDisplay.value = "";
    form.categoryId = "";
    form.walletFromId = "";
    form.walletToId = "";
    form.description = "";
    form.notes = "";
    form.quantity = 1;
    form.unitPrice = 0;
    unitPriceDisplay.value = "";
    form.isPromo = false;
    form.promoType = "PERCENTAGE";
    form.promoValue = 0;
    promoValueDisplay.value = "";
    form.promoDetails = "";
});

// ── Amount input ─────────────────────────────────────────────
const amountDisplay = ref("");

const onAmountInput = (e: Event) => {
    const raw = (e.target as HTMLInputElement).value.replace(/\D/g, "");
    const num = parseInt(raw) || 0;
    form.amount = num;
    amountDisplay.value = num > 0 ? num.toLocaleString("id-ID") : "";
};

// ── Category picker (bottom sheet) ───────────────────────────
const showCategoryPicker = ref(false);

const selectedCategory = computed(() =>
    allCategories.value.find((c: any) => c.id === form.categoryId),
);

// ── Wallet picker (bottom sheet) ────────────────────────────
const showWalletFromPicker = ref(false);
const showWalletToPicker = ref(false);

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
            return form.amount > selectedWalletFrom.value.balance;
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

// ── Submit ───────────────────────────────────────────────────
const submit = async () => {
    if (!canSubmit.value || saving.value) return;
    saving.value = true;

    const payload = {
        amount: form.amount,
        type: txType.value,
        categoryId: form.categoryId,
        walletFromId: form.walletFromId || undefined,
        walletToId: form.walletToId || undefined,
        description: form.description || undefined,
        notes: form.notes || undefined,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        // Detail fields
        quantity: txType.value === "EXPENSE" ? form.quantity : undefined,
        unitPrice: txType.value === "EXPENSE" ? form.unitPrice : undefined,
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
    };

    try {
        if (isOnline.value) {
            // Online: Always create the immediate transaction
            await $fetch("/api/transactions", {
                method: "POST",
                body: payload,
            });

            // If recurring is enabled, calculate the NEXT date and create the recurring schedule
            if (form.isRecurring) {
                let nextDate = new Date(form.date || new Date());
                if (form.recurringInterval === 'DAILY') {
                    nextDate.setDate(nextDate.getDate() + 1);
                } else if (form.recurringInterval === 'WEEKLY') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (form.recurringInterval === 'MONTHLY') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                } else if (form.recurringInterval === 'YEARLY') {
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                }

                const recurringPayload = {
                    ...payload,
                    interval: form.recurringInterval,
                    startDate: nextDate.toISOString(), // Start on the next cycle, since current is handled above
                    endDate: form.recurringEndDate ? new Date(form.recurringEndDate).toISOString() : undefined,
                };

                await $fetch("/api/recurring-transactions", {
                    method: "POST",
                    body: recurringPayload,
                });
            }
            toast.message = form.isRecurring ? "Transaksi & Jadwal Berulang berhasil ditambahkan! 🎉" : "Transaksi berhasil ditambahkan! 🎉";
        } else {
            // Offline: Save locally
            saveOffline(payload);
            toast.message = "Kamu offline. Transaksi disimpan di HP-mu & akan disinkronkan nanti! 💾";
        }

        toast.type = "success";
        toast.show = true;

        // Navigate back after a brief delay
        setTimeout(() => {
            router.push("/");
        }, 800);
    } catch (err: any) {
        toast.message = err?.data?.message ?? "Gagal menambahkan transaksi";
        toast.type = "error";
        toast.show = true;
        saving.value = false;
    }
};

// ── Type color helpers ───────────────────────────────────────
const typeColor = computed(() => {
    switch (txType.value) {
        case "EXPENSE":
            return "rose";
        case "INCOME":
            return "emerald";
        case "TRANSFER":
            return "blue";
    }
});

</script>

<template>
    <div class="space-y-4 animate-fade-in">
        <!-- ── Header with back button ───────────────────────────── -->
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
                    Tambah Transaksi
                </h2>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                    Catat pemasukan atau pengeluaran
                </p>
            </div>
        </div>

        <!-- ── Transaction Type Selector ─────────────────────────── -->
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
                    >
                        📦 Nama Produk / Item
                    </label>
                    <input
                        v-model="form.description"
                        type="text"
                        class="input"
                        placeholder="misal: Indomie Goreng, Kopi Susu"
                    />
                </div>

                <!-- Tanggal -->
                <div class="card rounded-2xl p-4">
                    <label
                        class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1.5 block"
                    >
                        📅 Tanggal
                    </label>
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
                                for="isPromo"
                                >Gunakan Promo</label
                            >
                        </div>
                        <input
                            id="isPromo"
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
                            backgroundColor: selectedWalletFrom.color + '20',
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
                            Saldo di {{ selectedWalletFrom?.name }} hanya
                            {{ formatIDR(selectedWalletFrom?.balance || 0) }}.
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

                <!-- Recurring Toggle -->
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-bold text-gray-800 dark:text-gray-100">Jadikan Transaksi Berulang?</p>
                            <p class="text-[10px] text-gray-400 mt-0.5">Otomatis catat transaksi ini setiap periode tertentu.</p>
                        </div>
                        <button type="button" @click="form.isRecurring = !form.isRecurring"
                                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                                :class="form.isRecurring ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'">
                            <span :class="form.isRecurring ? 'translate-x-6' : 'translate-x-1'"
                                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200" />
                        </button>
                    </div>
                    
                    <div v-if="form.isRecurring" class="mt-4 space-y-3 animate-slide-up border-t border-gray-100 dark:border-gray-800 pt-4">
                        <div>
                            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Interval</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button v-for="opt in ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']" :key="opt"
                                        @click="form.recurringInterval = opt as any"
                                        class="py-2 rounded-xl text-xs font-bold transition-all"
                                        :class="form.recurringInterval === opt ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-500 border border-primary-200' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'">
                                    {{ opt === 'DAILY' ? 'Harian' : opt === 'WEEKLY' ? 'Mingguan' : opt === 'MONTHLY' ? 'Bulanan' : 'Tahunan' }}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Berakhir Pada (Opsional)</label>
                            <input v-model="form.recurringEndDate" type="date" class="input text-sm" />
                        </div>
                    </div>
                </div>

                <!-- Total Nominal (Big Display) -->
                <div
                    class="card rounded-2xl p-6 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-surface-900 text-center border-2 border-rose-100 dark:border-rose-900/30"
                >
                    <p
                        class="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1"
                    >
                        Total Nominal
                    </p>
                    <div class="flex items-center justify-center gap-1">
                        <span class="text-lg font-bold text-rose-400">Rp</span>
                        <input
                            :value="amountDisplay"
                            type="text"
                            readonly
                            class="text-3xl font-black text-rose-500 bg-transparent border-none outline-none w-full max-w-[200px] text-center"
                        />
                    </div>
                    <p class="text-[10px] text-gray-400 mt-1">
                        {{ form.quantity }} x {{ formatIDR(form.unitPrice) }}
                    </p>
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
                        placeholder="misal: Gaji Bulanan, Freelance"
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

                <!-- Jumlah Pemasukan (Big) -->
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
                            backgroundColor: selectedWalletFrom.color + '20',
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
                                selectedWalletFrom?.name ?? "Pilih dompet asal"
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
                                selectedWalletTo?.name ?? "Pilih dompet tujuan"
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

                <!-- Nominal (Big) -->
                <div
                    class="card rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-surface-900 text-center border-2 border-blue-100 dark:border-blue-900/30"
                >
                    <p
                        class="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1"
                    >
                        Nominal Transfer
                    </p>
                    <div class="flex items-center justify-center gap-1">
                        <span class="text-lg font-bold text-blue-400">Rp</span>
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
                            Saldo di {{ selectedWalletFrom?.name }} hanya
                            {{ formatIDR(selectedWalletFrom?.balance || 0) }}.
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

        <!-- ── Submit Button ─────────────────────────────────────── -->
        <button
            class="w-full py-4 rounded-2xl text-white text-sm font-bold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="
                txType === 'EXPENSE'
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30'
                    : txType === 'INCOME'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30'
            "
            :disabled="!canSubmit || saving"
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
            <span v-else class="text-lg">
                {{
                    txType === "EXPENSE"
                        ? "💸"
                        : txType === "INCOME"
                          ? "💰"
                          : "🔄"
                }}
            </span>
            <span>
                {{ saving ? "Menyimpan..." : "Simpan Transaksi" }}
            </span>
        </button>

        <!-- Bottom spacer -->
        <div class="h-4" />

        <!-- ══════════════════════════════════════════════════════════
         PICKERS (Bottom Sheets)
    ══════════════════════════════════════════════════════════ -->

        <!-- ── Category Picker ─────────────────────────────────────── -->
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
                    >
                        {{ cat.icon }}
                    </span>
                    <span
                        class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1"
                    >
                        {{ cat.name }}
                    </span>
                    <span
                        v-if="form.categoryId === cat.id"
                        class="text-primary-500 font-bold"
                        >✓</span
                    >
                </button>

                <div
                    v-if="filteredCategories.length === 0"
                    class="py-6 text-center"
                >
                    <span class="text-3xl">🏷️</span>
                    <p class="text-sm text-gray-400 mt-2">
                        Belum ada kategori. Buat di halaman Master Data.
                    </p>
                </div>
            </div>
        </BottomSheet>

        <!-- ── Wallet From Picker ──────────────────────────────────── -->
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
                    >
                        {{ walletTypeIcon(w.type) }}
                    </span>
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

        <!-- ── Wallet To Picker ────────────────────────────────────── -->
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
                    >
                        {{ walletTypeIcon(w.type) }}
                    </span>
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

        <!-- ── Toast ───────────────────────────────────────────────── -->
        <Toast
            v-model="toast.show"
            :message="toast.message"
            :type="toast.type"
        />
    </div>
</template>

<script setup lang="ts">
// pages/profile/export.vue — Export data modal

useHead({ title: "Export Data — CashPlow" });
const router = useRouter();

const now = new Date();
const periodMode = ref<"monthly" | "yearly" | "all">("monthly");
const format = ref<"xlsx" | "json">("xlsx");
const selectedType = ref<"ALL" | "INCOME" | "EXPENSE" | "TRANSFER">("ALL");

const period = reactive({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
});

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

const years = computed(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
});

const isDownloading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const handleDownload = async () => {
    try {
        isDownloading.value = true;
        errorMessage.value = "";
        successMessage.value = "";

        const params = new URLSearchParams();
        if (periodMode.value === "monthly") {
            params.append("month", String(period.month));
            params.append("year", String(period.year));
        } else if (periodMode.value === "yearly") {
            params.append("year", String(period.year));
        }
        params.append("format", format.value);
        if (selectedType.value !== "ALL") {
            params.append("type", selectedType.value);
        }

        const url = `/api/analytics/export?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            let errMsg = `Gagal mengunduh file (${response.status})`;
            try {
                const errData = await response.json();
                if (errData?.message) errMsg = errData.message;
            } catch {
                // Ignore json parse error
            }
            throw new Error(errMsg);
        }

        const blob = await response.blob();
        const disposition = response.headers.get("content-disposition");
        let filename = `CashPlow_Export_${new Date().toISOString().slice(0, 10)}.${format.value}`;
        if (disposition && disposition.includes("filename=")) {
            const match = disposition.match(/filename="?([^";]+)"?/);
            if (match && match[1]) filename = match[1];
        }

        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);

        successMessage.value = `Berhasil mengunduh file ${filename}`;
    } catch (err: any) {
        errorMessage.value = err?.message || "Terjadi kesalahan saat mengunduh data.";
    } finally {
        isDownloading.value = false;
    }
};
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8"
                @click.self="router.back()"
            >
                <Transition
                    enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
                    enter-from-class="opacity-0 translate-y-8 scale-95"
                    enter-to-class="opacity-100 translate-y-0 scale-100"
                    leave-active-class="transition-all duration-200 ease-in"
                    leave-from-class="opacity-100 translate-y-0 scale-100"
                    leave-to-class="opacity-0 translate-y-4 scale-95"
                >
                    <div
                        class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5"
                    >
                        <!-- Header -->
                        <div class="flex items-center justify-between">
                            <button
                                @click="router.back()"
                                class="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                <svg
                                    class="w-5 h-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                            <h1
                                class="text-lg font-bold text-gray-800 dark:text-gray-100"
                            >
                                Export Data Keuangan
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <!-- Info Header -->
                        <div class="flex flex-col items-center text-center gap-1.5">
                            <div
                                class="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center text-2xl mb-1 shadow-sm border border-emerald-100 dark:border-emerald-800/50"
                            >
                                📊
                            </div>
                            <h2
                                class="text-base font-bold text-gray-800 dark:text-gray-100"
                            >
                                Unduh Riwayat & Laporan
                            </h2>
                            <p
                                class="text-xs text-gray-400 dark:text-gray-500 max-w-[260px]"
                            >
                                Ekspor data transaksi kamu dalam format Excel spreadsheet yang rapi atau JSON backup.
                            </p>
                        </div>

                        <!-- Feedback Messages -->
                        <div
                            v-if="successMessage"
                            class="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2"
                        >
                            <span class="text-base">✅</span>
                            <span>{{ successMessage }}</span>
                        </div>

                        <div
                            v-if="errorMessage"
                            class="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 text-xs font-semibold rounded-2xl border border-rose-200 dark:border-rose-900/60 flex items-center gap-2"
                        >
                            <span class="text-base">⚠️</span>
                            <span>{{ errorMessage }}</span>
                        </div>

                        <!-- Format Selection -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                                Format Berkas
                            </label>
                            <div class="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    @click="format = 'xlsx'"
                                    class="p-3 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-1"
                                    :class="
                                        format === 'xlsx'
                                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-gray-500 hover:border-gray-200'
                                    "
                                >
                                    <div class="flex items-center justify-between">
                                        <span class="text-lg">📗</span>
                                        <span
                                            v-if="format === 'xlsx'"
                                            class="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center"
                                        >✓</span>
                                    </div>
                                    <span class="text-xs font-bold text-gray-800 dark:text-gray-100">Excel (.xlsx)</span>
                                    <span class="text-[10px] text-gray-400 dark:text-gray-500">Laporan & Ringkasan rapi</span>
                                </button>

                                <button
                                    type="button"
                                    @click="format = 'json'"
                                    class="p-3 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col gap-1"
                                    :class="
                                        format === 'json'
                                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 text-gray-500 hover:border-gray-200'
                                    "
                                >
                                    <div class="flex items-center justify-between">
                                        <span class="text-lg">📦</span>
                                        <span
                                            v-if="format === 'json'"
                                            class="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center"
                                        >✓</span>
                                    </div>
                                    <span class="text-xs font-bold text-gray-800 dark:text-gray-100">JSON Backup</span>
                                    <span class="text-[10px] text-gray-400 dark:text-gray-500">Cadangan seluruh data</span>
                                </button>
                            </div>
                        </div>

                        <!-- Period Mode Tabs -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                                Rentang Waktu
                            </label>
                            <div class="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                                <button
                                    type="button"
                                    @click="periodMode = 'monthly'"
                                    class="py-2 text-xs font-bold rounded-xl transition-all"
                                    :class="
                                        periodMode === 'monthly'
                                            ? 'bg-white dark:bg-surface-900 text-gray-800 dark:text-gray-100 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    "
                                >
                                    Bulanan
                                </button>
                                <button
                                    type="button"
                                    @click="periodMode = 'yearly'"
                                    class="py-2 text-xs font-bold rounded-xl transition-all"
                                    :class="
                                        periodMode === 'yearly'
                                            ? 'bg-white dark:bg-surface-900 text-gray-800 dark:text-gray-100 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    "
                                >
                                    Tahunan
                                </button>
                                <button
                                    type="button"
                                    @click="periodMode = 'all'"
                                    class="py-2 text-xs font-bold rounded-xl transition-all"
                                    :class="
                                        periodMode === 'all'
                                            ? 'bg-white dark:bg-surface-900 text-gray-800 dark:text-gray-100 shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                    "
                                >
                                    Semua
                                </button>
                            </div>
                        </div>

                        <!-- Period Selectors -->
                        <div v-if="periodMode === 'monthly'" class="grid grid-cols-2 gap-3 animate-fade-in">
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                                    Bulan
                                </label>
                                <select
                                    v-model="period.month"
                                    class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                                >
                                    <option
                                        v-for="(m, i) in MONTHS_ID"
                                        :key="m"
                                        :value="i + 1"
                                    >
                                        {{ m }}
                                    </option>
                                </select>
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                                    Tahun
                                </label>
                                <select
                                    v-model="period.year"
                                    class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                                >
                                    <option
                                        v-for="y in years"
                                        :key="y"
                                        :value="y"
                                    >
                                        {{ y }}
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div v-else-if="periodMode === 'yearly'" class="space-y-1.5 animate-fade-in">
                            <label class="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                                Tahun
                            </label>
                            <select
                                v-model="period.year"
                                class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all cursor-pointer"
                            >
                                <option
                                    v-for="y in years"
                                    :key="y"
                                    :value="y"
                                >
                                    Tahun {{ y }} (12 Bulan)
                                </option>
                            </select>
                        </div>

                        <!-- Transaction Type Filter -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1">
                                Filter Transaksi
                            </label>
                            <div class="grid grid-cols-4 gap-1.5">
                                <button
                                    type="button"
                                    @click="selectedType = 'ALL'"
                                    class="py-2 rounded-xl text-xs font-semibold border transition-all"
                                    :class="
                                        selectedType === 'ALL'
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold'
                                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 text-gray-500'
                                    "
                                >
                                    Semua
                                </button>
                                <button
                                    type="button"
                                    @click="selectedType = 'INCOME'"
                                    class="py-2 rounded-xl text-xs font-semibold border transition-all"
                                    :class="
                                        selectedType === 'INCOME'
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 text-gray-500'
                                    "
                                >
                                    Masuk
                                </button>
                                <button
                                    type="button"
                                    @click="selectedType = 'EXPENSE'"
                                    class="py-2 rounded-xl text-xs font-semibold border transition-all"
                                    :class="
                                        selectedType === 'EXPENSE'
                                            ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 text-gray-500'
                                    "
                                >
                                    Keluar
                                </button>
                                <button
                                    type="button"
                                    @click="selectedType = 'TRANSFER'"
                                    class="py-2 rounded-xl text-xs font-semibold border transition-all"
                                    :class="
                                        selectedType === 'TRANSFER'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                                            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 text-gray-500'
                                    "
                                >
                                    Transfer
                                </button>
                            </div>
                        </div>

                        <!-- Action Button -->
                        <button
                            type="button"
                            :disabled="isDownloading"
                            @click="handleDownload"
                            class="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <div
                                v-if="isDownloading"
                                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                            ></div>
                            <svg
                                v-else
                                class="w-5 h-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <path
                                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                                />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" x2="12" y1="15" y2="3" />
                            </svg>
                            <span>{{
                                isDownloading
                                    ? "Memproses & Mengunduh..."
                                    : format === "xlsx"
                                    ? "Unduh Laporan Excel (.xlsx)"
                                    : "Unduh Berkas Backup (.json)"
                            }}</span>
                        </button>

                        <p
                            class="text-center text-[10px] text-gray-400 dark:text-gray-500"
                        >
                            Format Excel yang diunduh kompatibel langsung dengan fitur Import Data CashPlow.
                        </p>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>


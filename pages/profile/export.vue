<script setup lang="ts">
// pages/profile/export.vue — Export data modal

useHead({ title: "Export Data — CashPlow" });
const router = useRouter();

const now = new Date();
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
    return [currentYear, currentYear - 1, currentYear - 2];
});

const exportUrl = computed(() => {
    return `/api/analytics/export?month=${period.month}&year=${period.year}`;
});

const isDownloading = ref(false);

const handleDownload = () => {
    isDownloading.value = true;
    // The browser will handle the download via <a> tag, we just show a temporary state
    setTimeout(() => {
        isDownloading.value = false;
    }, 2000);
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
                        class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        <!-- Header -->
                        <div class="flex items-center justify-between mb-6">
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
                                Export Laporan
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <div class="space-y-6 py-2">
                            <div
                                class="flex flex-col items-center text-center gap-2 mb-2"
                            >
                                <div
                                    class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center text-3xl mb-1 shadow-sm border border-emerald-100 dark:border-emerald-800/50"
                                >
                                    📊
                                </div>
                                <h2
                                    class="text-base font-bold text-gray-800 dark:text-gray-100"
                                >
                                    Unduh Riwayat Excel
                                </h2>
                                <p
                                    class="text-xs text-gray-400 dark:text-gray-500 max-w-[240px]"
                                >
                                    Pilih periode laporan yang ingin kamu unduh
                                    dalam format Microsoft Excel (.xlsx)
                                </p>
                            </div>

                            <!-- Selection Row -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="space-y-1.5">
                                    <label
                                        class="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1"
                                        >Bulan</label
                                    >
                                    <select
                                        v-model="period.month"
                                        class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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
                                    <label
                                        class="text-[10px] font-bold uppercase tracking-wider text-gray-400 ml-1"
                                        >Tahun</label
                                    >
                                    <select
                                        v-model="period.year"
                                        class="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none text-sm font-semibold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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

                            <div
                                class="h-px bg-gray-100 dark:bg-gray-800 my-2"
                            ></div>

                            <!-- Action Button -->
                            <a
                                :href="exportUrl"
                                target="_blank"
                                @click="handleDownload"
                                class="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <svg
                                    v-if="!isDownloading"
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
                                <div
                                    v-else
                                    class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                ></div>
                                <span>Unduh Laporan Excel</span>
                            </a>

                            <p
                                class="text-center text-[10px] text-gray-400 dark:text-gray-600"
                            >
                                Data akan diformat rapi dengan ringkasan
                                pemasukan & pengeluaran.
                            </p>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

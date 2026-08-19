<script setup lang="ts">
// pages/profile/import.vue — Import & Restore Data (Excel & JSON Backup)
useHead({ title: "Import & Restore Data — CashPlow" });
const router = useRouter();

// Tab state: 'EXCEL' | 'JSON'
const activeTab = ref<'EXCEL' | 'JSON'>('EXCEL');

// ── File States ────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const loading = ref(false);
const error = ref("");
const successMessage = ref("");
const importErrors = ref<string[]>([]);
const restoreStats = ref<any>(null);

const triggerFileSelect = () => {
    fileInput.value?.click();
};

const handleTabChange = (tab: 'EXCEL' | 'JSON') => {
    activeTab.value = tab;
    selectedFile.value = null;
    error.value = "";
    successMessage.value = "";
    importErrors.value = [];
    restoreStats.value = null;
    if (fileInput.value) fileInput.value.value = "";
};

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (activeTab.value === 'EXCEL' && !file.name.endsWith('.xlsx')) {
        error.value = "Hanya mendukung berkas format .xlsx (Excel)";
        selectedFile.value = null;
        return;
    }
    if (activeTab.value === 'JSON' && !file.name.endsWith('.json')) {
        error.value = "Hanya mendukung berkas cadangan format .json";
        selectedFile.value = null;
        return;
    }

    selectedFile.value = file;
    error.value = "";
    successMessage.value = "";
    importErrors.value = [];
    restoreStats.value = null;
};

const handleExecute = async () => {
    if (!selectedFile.value) return;

    loading.value = true;
    error.value = "";
    importErrors.value = [];
    successMessage.value = "";
    restoreStats.value = null;

    const formData = new FormData();
    formData.append("file", selectedFile.value);

    try {
        if (activeTab.value === 'EXCEL') {
            const response: any = await $fetch("/api/transactions/import", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                successMessage.value = response.message;
                if (response.errors) {
                    importErrors.value = response.errors;
                }
                selectedFile.value = null;
                if (fileInput.value) fileInput.value.value = "";
            }
        } else {
            // Restore JSON
            const response: any = await $fetch("/api/transactions/restore", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                successMessage.value = response.message;
                restoreStats.value = response.stats;
                selectedFile.value = null;
                if (fileInput.value) fileInput.value.value = "";
            }
        }
    } catch (err: any) {
        error.value =
            err.data?.message ||
            "Gagal memproses data. Pastikan format berkas sesuai template.";
    } finally {
        loading.value = false;
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
                    appear
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
                        <div class="flex items-center justify-between mb-5">
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
                                Impor & Pulihkan Data
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <!-- Tab Switcher -->
                        <div class="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/60 mb-5">
                            <button
                                @click="handleTabChange('EXCEL')"
                                class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                :class="activeTab === 'EXCEL' ? 'bg-white dark:bg-surface-900 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600'"
                            >
                                <span>📊</span>
                                <span>Impor Transaksi (.xlsx)</span>
                            </button>
                            <button
                                @click="handleTabChange('JSON')"
                                class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                :class="activeTab === 'JSON' ? 'bg-white dark:bg-surface-900 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600'"
                            >
                                <span>📦</span>
                                <span>Restore Cadangan (.json)</span>
                            </button>
                        </div>

                        <div class="space-y-4">
                            <!-- Success/Error States -->
                            <div
                                v-if="successMessage"
                                class="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-start gap-3"
                            >
                                <span class="text-lg leading-none">✅</span>
                                <div>
                                    <p>{{ successMessage }}</p>
                                    <!-- Stats display for JSON restore -->
                                    <div v-if="restoreStats" class="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                                        <div>• Transaksi: <b>{{ restoreStats.transactionsCount }}</b></div>
                                        <div>• Dompet Baru: <b>{{ restoreStats.walletsCount }}</b></div>
                                        <div>• Kategori Baru: <b>{{ restoreStats.categoriesCount }}</b></div>
                                        <div>• Anggaran: <b>{{ restoreStats.budgetsCount }}</b></div>
                                        <div>• Tabungan: <b>{{ restoreStats.savingsCount }}</b></div>
                                        <div>• Hutang/Piutang: <b>{{ restoreStats.debtsCount }}</b></div>
                                    </div>
                                </div>
                            </div>

                            <div
                                v-if="error"
                                class="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold rounded-2xl border border-rose-100 dark:border-rose-900/50"
                            >
                                {{ error }}
                            </div>

                            <!-- Format Instructions: EXCEL -->
                            <div
                                v-if="activeTab === 'EXCEL'"
                                class="card bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2.5"
                            >
                                <h3
                                    class="text-xs font-black uppercase tracking-widest text-gray-400"
                                >
                                    Instruksi Format Excel (.xlsx)
                                </h3>
                                <p
                                    class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed"
                                >
                                    File harus memiliki header pada baris pertama dan format kolom yang kompatibel dengan hasil Export CashPlow:
                                </p>
                                <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                                    <div class="p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800">
                                        <b class="text-primary-500">B:</b> Tanggal (DD/MM/YYYY)
                                    </div>
                                    <div class="p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800">
                                        <b class="text-primary-500">C:</b> Keterangan
                                    </div>
                                    <div class="p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800">
                                        <b class="text-primary-500">D:</b> Kategori
                                    </div>
                                    <div class="p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800">
                                        <b class="text-primary-500">E:</b> Tipe (Masuk/Keluar)
                                    </div>
                                    <div class="p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800">
                                        <b class="text-primary-500">F:</b> Dompet
                                    </div>
                                    <div class="p-1.5 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800">
                                        <b class="text-primary-500">I:</b> Total Nominal
                                    </div>
                                </div>
                            </div>

                            <!-- Format Instructions: JSON -->
                            <div
                                v-else
                                class="card bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2.5"
                            >
                                <h3
                                    class="text-xs font-black uppercase tracking-widest text-gray-400"
                                >
                                    Instruksi Pemulihan Cadangan JSON
                                </h3>
                                <p
                                    class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed"
                                >
                                    Gunakan berkas cadangan <code>.json</code> yang diunduh dari menu <b>Export Data > Format JSON Backup</b>. Seluruh entitas (Dompet, Kategori, Transaksi, Anggaran, Jadwal Rutin, Tabungan, dan Hutang) akan dipulihkan secara otomatis.
                                </p>
                            </div>

                            <!-- Upload Area -->
                            <div
                                class="border-2 border-dashed rounded-3xl p-7 flex flex-col items-center justify-center text-center gap-2.5 transition-all duration-300 cursor-pointer"
                                :class="
                                    selectedFile
                                        ? 'border-primary-500 bg-primary-50/10'
                                        : 'border-gray-200 dark:border-gray-800 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/30'
                                "
                                @click="triggerFileSelect"
                            >
                                <input
                                    ref="fileInput"
                                    type="file"
                                    :accept="activeTab === 'EXCEL' ? '.xlsx' : '.json'"
                                    class="hidden"
                                    @change="handleFileChange"
                                />

                                <div
                                    class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl shadow-sm"
                                >
                                    {{ selectedFile ? (activeTab === 'EXCEL' ? '📊' : '📦') : '📁' }}
                                </div>

                                <div v-if="selectedFile">
                                    <p
                                        class="text-xs font-bold text-gray-800 dark:text-gray-100 truncate max-w-[220px]"
                                    >
                                        {{ selectedFile.name }}
                                    </p>
                                    <p
                                        class="text-[10px] text-primary-500 font-bold mt-0.5 uppercase tracking-tighter"
                                    >
                                        Berkas Siap Diproses ({{ (selectedFile.size / 1024).toFixed(1) }} KB)
                                    </p>
                                </div>
                                <div v-else>
                                    <p
                                        class="text-xs font-bold text-gray-700 dark:text-gray-200"
                                    >
                                        {{ activeTab === 'EXCEL' ? 'Pilih Berkas Excel (.xlsx)' : 'Pilih Berkas Cadangan (.json)' }}
                                    </p>
                                    <p class="text-[10px] text-gray-400 mt-0.5">
                                        Tap untuk memilih file dari penyimpanan Anda
                                    </p>
                                </div>
                            </div>

                            <!-- Row Errors (if any) -->
                            <div
                                v-if="importErrors.length"
                                class="max-h-32 overflow-y-auto space-y-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50"
                            >
                                <p
                                    class="text-[10px] font-black text-amber-600 uppercase mb-1"
                                >
                                    Beberapa baris dilewati:
                                </p>
                                <p
                                    v-for="err in importErrors"
                                    :key="err"
                                    class="text-[10px] text-amber-700 dark:text-amber-400"
                                >
                                    • {{ err }}
                                </p>
                            </div>

                            <button
                                :disabled="!selectedFile || loading"
                                class="w-full py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                                @click="handleExecute"
                            >
                                <div
                                    v-if="loading"
                                    class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                ></div>
                                <span>{{
                                    loading
                                        ? "Sedang Memproses Data..."
                                        : (activeTab === 'EXCEL' ? "Mulai Impor Transaksi Excel" : "Pulihkan Seluruh Data Cadangan")
                                }}</span>
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

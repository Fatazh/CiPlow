<script setup lang="ts">
// pages/profile/import.vue — Import data modal

useHead({ title: "Import Data — CashPlow" });
const router = useRouter();

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);
const loading = ref(false);
const error = ref("");
const successMessage = ref("");
const importErrors = ref<string[]>([]);

const triggerFileSelect = () => {
    fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
        if (!file.name.endsWith(".xlsx")) {
            error.value = "Hanya mendukung file format .xlsx (Excel)";
            selectedFile.value = null;
            return;
        }
        selectedFile.value = file;
        error.value = "";
    }
};

const handleImport = async () => {
    if (!selectedFile.value) return;

    loading.value = true;
    error.value = "";
    importErrors.value = [];
    successMessage.value = "";

    const formData = new FormData();
    formData.append("file", selectedFile.value);

    try {
        const response: any = await $fetch("/api/transactions/import", {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            successMessage.value = response.message;
            if (response.errors) {
                importErrors.value = response.errors;
            }
            // Clear after success
            selectedFile.value = null;
            if (fileInput.value) fileInput.value.value = "";

            // Auto-back after 3 seconds if no row-level errors
            if (!response.errors) {
                setTimeout(() => close(), 3000);
            }
        }
    } catch (err: any) {
        error.value =
            err.data?.message ||
            "Gagal mengimpor data. Pastikan format file sesuai template.";
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
                                Import Data
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <div class="space-y-5 py-2">
                            <!-- Success/Error States -->
                            <div
                                v-if="successMessage"
                                class="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3"
                            >
                                <span>✅</span>
                                <span>{{ successMessage }}</span>
                            </div>

                            <div
                                v-if="error"
                                class="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold rounded-2xl border border-rose-100 dark:border-rose-900/50"
                            >
                                {{ error }}
                            </div>

                            <!-- Format Instructions -->
                            <div
                                class="card bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3"
                            >
                                <h3
                                    class="text-xs font-black uppercase tracking-widest text-gray-400"
                                >
                                    Instruksi Format Excel
                                </h3>
                                <p
                                    class="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed"
                                >
                                    File harus memiliki header pada baris
                                    pertama. Gunakan kolom berikut mulai dari
                                    kolom <b>B</b>:
                                </p>
                                <div class="grid grid-cols-2 gap-2">
                                    <div
                                        class="p-2 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 text-[10px]"
                                    >
                                        <span class="font-bold text-primary-500"
                                            >B:</span
                                        >
                                        Tanggal (DD/MM/YYYY)
                                    </div>
                                    <div
                                        class="p-2 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 text-[10px]"
                                    >
                                        <span class="font-bold text-primary-500"
                                            >C:</span
                                        >
                                        Keterangan
                                    </div>
                                    <div
                                        class="p-2 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 text-[10px]"
                                    >
                                        <span class="font-bold text-primary-500"
                                            >D:</span
                                        >
                                        Nama Kategori
                                    </div>
                                    <div
                                        class="p-2 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 text-[10px]"
                                    >
                                        <span class="font-bold text-primary-500"
                                            >E:</span
                                        >
                                        Tipe (Masuk/Keluar)
                                    </div>
                                    <div
                                        class="p-2 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 text-[10px]"
                                    >
                                        <span class="font-bold text-primary-500"
                                            >F:</span
                                        >
                                        Nama Dompet
                                    </div>
                                    <div
                                        class="p-2 rounded-lg bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 text-[10px]"
                                    >
                                        <span class="font-bold text-primary-500"
                                            >G:</span
                                        >
                                        Nominal (Angka)
                                    </div>
                                </div>
                                <p class="text-[9px] italic text-gray-400">
                                    Tips: Nama Kategori dan Dompet harus persis
                                    sama dengan yang ada di aplikasi.
                                </p>
                            </div>

                            <!-- Upload Area -->
                            <div
                                class="border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 cursor-pointer"
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
                                    accept=".xlsx"
                                    class="hidden"
                                    @change="handleFileChange"
                                />

                                <div
                                    class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl"
                                >
                                    {{ selectedFile ? "📄" : "📁" }}
                                </div>

                                <div v-if="selectedFile">
                                    <p
                                        class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate max-w-[200px]"
                                    >
                                        {{ selectedFile.name }}
                                    </p>
                                    <p
                                        class="text-[10px] text-primary-500 font-bold mt-1 uppercase tracking-tighter"
                                    >
                                        File Terpilih
                                    </p>
                                </div>
                                <div v-else>
                                    <p
                                        class="text-sm font-bold text-gray-600 dark:text-gray-300"
                                    >
                                        Pilih File Excel
                                    </p>
                                    <p class="text-[10px] text-gray-400 mt-1">
                                        Tap untuk mencari file .xlsx
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
                                class="w-full py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                @click="handleImport"
                            >
                                <div
                                    v-if="loading"
                                    class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                ></div>
                                <span>{{
                                    loading
                                        ? "Memproses Import..."
                                        : "Mulai Import Data"
                                }}</span>
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

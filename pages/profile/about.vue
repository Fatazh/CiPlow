<script setup lang="ts">
useHead({ title: "Tentang App — CashPlow" });
const router = useRouter();
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
                                Tentang Aplikasi
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <div class="text-center space-y-5 py-4">
                            <div
                                class="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl font-black mx-auto shadow-xl shadow-emerald-500/20"
                            >
                                P
                            </div>

                            <div>
                                <h2
                                    class="text-xl font-bold text-gray-800 dark:text-gray-100"
                                >
                                    CashPlow Budget Tracker
                                </h2>
                                <p
                                    class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1"
                                >
                                    Versi 1.0.0
                                </p>
                            </div>

                            <div
                                class="h-px bg-gray-100 dark:bg-gray-800 my-2"
                            ></div>

                            <p
                                class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed text-left"
                            >
                                CashPlow adalah aplikasi pencatat keuangan
                                pribadi yang dirancang untuk membantu Anda
                                memantau pemasukan, pengeluaran, serta anggaran
                                bulanan dengan mudah dan praktis.
                            </p>

                            <div
                                class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 text-left space-y-3 text-sm border border-gray-100 dark:border-gray-800"
                            >
                                <div class="flex justify-between">
                                    <span
                                        class="text-gray-500 dark:text-gray-400"
                                        >Developer</span
                                    >
                                    <span
                                        class="font-semibold text-gray-700 dark:text-gray-200"
                                        >CashPlow Team</span
                                    >
                                </div>
                                <div class="flex justify-between">
                                    <span
                                        class="text-gray-500 dark:text-gray-400"
                                        >Lisensi</span
                                    >
                                    <span
                                        class="font-semibold text-gray-700 dark:text-gray-200"
                                        >MIT License</span
                                    >
                                </div>
                            </div>

                            <p
                                class="text-[11px] text-gray-400 dark:text-gray-600 pt-4"
                            >
                                © 2026 CashPlow. All rights reserved.
                            </p>

                            <button
                                @click="router.back()"
                                class="w-full mt-6 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

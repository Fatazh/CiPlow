<script setup lang="ts">
// pages/profile/notifications.vue — Dedicated Notification & Push Alert Settings
import { ref } from 'vue';

useHead({ title: "Pengaturan Notifikasi — CashPlow" });
const router = useRouter();
const { isSupported, isEnabled, permissionState, subscribe, unsubscribe, sendTestNotification, loading: pushLoading } = usePush();

const testNotificationSent = ref(false);

const handleTogglePush = async () => {
    if (isEnabled.value) {
        await unsubscribe();
    } else {
        await subscribe();
    }
};

const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (success) {
        testNotificationSent.value = true;
        setTimeout(() => {
            testNotificationSent.value = false;
        }, 3500);
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
                                Pengaturan Notifikasi
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <div class="space-y-5">
                            <!-- ── 1. Main Web Push Toggle ────────────────────── -->
                            <div
                                class="p-5 rounded-2xl border-2 transition-all space-y-3"
                                :class="isEnabled ? 'border-primary-200 bg-primary-50/20 dark:border-primary-900/40 dark:bg-primary-950/20' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-800/50'"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="w-11 h-11 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-2xl shadow-xs">
                                            {{ isEnabled ? '🔔' : '🔕' }}
                                        </div>
                                        <div>
                                            <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100">
                                                Notifikasi Perangkat (PWA)
                                            </h3>
                                            <p class="text-[11px] text-gray-400">
                                                {{ isEnabled ? 'Aktif di perangkat ini' : 'Nonaktif di perangkat ini' }}
                                            </p>
                                        </div>
                                    </div>

                                    <!-- Toggle Switch -->
                                    <button
                                        v-if="isSupported"
                                        type="button"
                                        :disabled="pushLoading"
                                        @click="handleTogglePush"
                                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none"
                                        :class="isEnabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'"
                                    >
                                        <span
                                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
                                            :class="isEnabled ? 'translate-x-6' : 'translate-x-1'"
                                        />
                                    </button>
                                </div>

                                <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    {{ isEnabled
                                        ? 'Notifikasi push aktif. Anda akan menerima peringatan batas anggaran dan info penting langsung di HP/browser Anda.'
                                        : 'Aktifkan notifikasi untuk mendapatkan peringatan anggaran (80% & 100%) dan pengingat transaksi otomatis secara real-time.'
                                    }}
                                </p>

                                <!-- Test Notification Button -->
                                <div v-if="isEnabled" class="pt-1">
                                    <button
                                        type="button"
                                        class="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98"
                                        @click="handleTestNotification"
                                    >
                                        <span>🔔</span>
                                        <span>Kirim Notifikasi Uji Coba ke HP</span>
                                    </button>
                                </div>

                                <!-- Test Sent Feedback -->
                                <div
                                    v-if="testNotificationSent"
                                    class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center animate-fade-in"
                                >
                                    ✓ Notifikasi uji coba telah dikirim ke layar HP Anda!
                                </div>

                                <!-- Denied Warning -->
                                <div v-if="permissionState === 'denied'" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 space-y-1">
                                    <p class="font-bold">⚠️ Izin Notifikasi Diblokir di Browser</p>
                                    <p class="text-[11px] leading-relaxed text-rose-500/90">
                                        Untuk mengaktifkan: Klik ikon gembok / pengaturan situs di sebelah URL browser HP Anda, lalu ubah status <strong>Notifikasi</strong> menjadi <strong>Izinkan (Allow)</strong>.
                                    </p>
                                </div>

                                <div v-if="!isSupported" class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-[11px] text-amber-700 dark:text-amber-400">
                                    ⚠️ Browser Anda saat ini belum mendukung Web Push Notifications. Coba buka melalui Chrome / Edge / install sebagai PWA di Home Screen.
                                </div>

                                <p v-if="pushLoading" class="text-[10px] text-primary-500 font-bold animate-pulse">
                                    ⏳ Memproses izin notifikasi...
                                </p>
                            </div>

                            <!-- ── 2. Notification Types ──────────────────────── -->
                            <div class="space-y-3">
                                <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
                                    Jenis Peringatan yang Diterima
                                </h3>

                                <!-- Peringatan Anggaran (Budget Alert) -->
                                <div class="card rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-800">
                                    <div class="flex items-center gap-3">
                                        <span class="text-xl">⚠️</span>
                                        <div>
                                            <h4 class="text-xs font-bold text-gray-800 dark:text-gray-100">
                                                Peringatan Anggaran (Budget Alert)
                                            </h4>
                                            <p class="text-[10px] text-gray-400 mt-0.5">
                                                Peringatan saat pengeluaran mendekati 80% & 100% batas bulanan
                                            </p>
                                        </div>
                                    </div>
                                    <span class="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                                        Aktif
                                    </span>
                                </div>

                                <!-- Pengingat Transaksi Berulang -->
                                <div class="card rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-800">
                                    <div class="flex items-center gap-3">
                                        <span class="text-xl">🔄</span>
                                        <div>
                                            <h4 class="text-xs font-bold text-gray-800 dark:text-gray-100">
                                                Jadwal Transaksi Berulang
                                            </h4>
                                            <p class="text-[10px] text-gray-400 mt-0.5">
                                                Notifikasi otomatis saat cron memproses tagihan berulang
                                            </p>
                                        </div>
                                    </div>
                                    <span class="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                                        Aktif
                                    </span>
                                </div>

                                <!-- Jatuh Tempo Hutang & Piutang -->
                                <div class="card rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-800">
                                    <div class="flex items-center gap-3">
                                        <span class="text-xl">🤝</span>
                                        <div>
                                            <h4 class="text-xs font-bold text-gray-800 dark:text-gray-100">
                                                Jatuh Tempo Hutang & Piutang
                                            </h4>
                                            <p class="text-[10px] text-gray-400 mt-0.5">
                                                Pengingat batas waktu penagihan piutang dan pembayaran hutang
                                            </p>
                                        </div>
                                    </div>
                                    <span class="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                                        Aktif
                                    </span>
                                </div>
                            </div>

                            <!-- Info Box -->
                            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                                <p class="text-[10px] text-gray-400 leading-relaxed">
                                    💡 <strong>Tips:</strong> Pastikan Anda telah mengizinkan notifikasi di pengaturan browser perangkat Anda agar pengingat dapat masuk meskipun aplikasi sedang ditutup.
                                </p>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

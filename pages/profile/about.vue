<script setup lang="ts">
// pages/profile/about.vue — About App & In-App Changelog Viewer (v1.2.3)
import { ref, onMounted } from 'vue';

useHead({ title: "Tentang App & Catatan Rilis — CashPlow" });
const router = useRouter();

const show = ref(false);
const activeTab = ref<'ABOUT' | 'CHANGELOG'>('ABOUT');

onMounted(() => {
    setTimeout(() => {
        show.value = true;
    }, 50);
});

const close = () => {
    show.value = false;
    setTimeout(() => {
        router.back();
    }, 300);
};

const changelogs = [
    {
        version: "v1.2.3",
        date: "Agustus 2026",
        isLatest: true,
        highlights: [
            "🔄 **CRUD Penuh Transaksi Berulang**: Sekarang Anda dapat mengedit, menghapus, serta menjeda/mengaktifkan kembali jadwal transaksi rutin.",
            "✨ **Asisten Finansial AI (Gemini Pro)**: Dapatkan evaluasi kesehatan finansial, skor cashflow, dan rekomendasi penghematan personal di menu Analitik.",
            "👁️ **Mode Privasi Saldo Global**: Sensor nominal saldo serentak di seluruh layar aplikasi hanya dengan satu klik pada kartu saldo.",
            "📦 **Pemulihan Cadangan Penuh (.json)**: Restore seluruh data transaksi, dompet, kategori, target tabungan, dan hutang dari file JSON cadangan.",
            "💬 **Pengingat Tagihan WhatsApp**: Kirimkan pesan pengingat tagihan piutang yang sopan dan otomatis langsung ke kontak WhatsApp.",
            "📋 **Histori Cicilan Hutang/Piutang**: Tinjau riwayat kronologis pembayaran cicilan pinjaman dan pelunasan.",
            "💡 **Kalkulator Proyeksi Target Tabungan**: Estimasi otomatis waktu tercapainya impian tabungan & target setoran bulanan.",
            "⭐ **Formulir Interaktif Rating & Lapor Bug**: Umpan balik langsung untuk perbaikan aplikasi.",
        ]
    },
    {
        version: "v1.2.2",
        date: "Agustus 2026",
        isLatest: false,
        highlights: [
            "📷 **Scan Struk Otomatis (Gemini Vision AI)**: Foto struk kasir untuk otomatis mengisi nominal, tanggal, merchant, dan kategori.",
            "🤝 **Fitur Hutang & Piutang**: Manajemen pinjaman uang lengkap dengan tanggal jatuh tempo dan integrasi saldo dompet.",
            "🎯 **Target Tabungan (Savings Goals)**: Lacak impian finansial dengan progress bar visual dan setor saldo fleksibel.",
            "🧮 **Kalkulator Cepat di Input Nominal**: Hitung ekspresi matematika (+, -, *, /) langsung di form transaksi.",
            "📄 **Ekspor Laporan PDF Visual**: Unduh ringkasan laporan keuangan lengkap dengan metrik grafis.",
        ]
    },
    {
        version: "v1.2.1",
        date: "Juli 2026",
        isLatest: false,
        highlights: [
            "📊 **Grafik Tren Finansial 6 Bulan & Analisis Mingguan**: Visualisasi pergerakan pemasukan dan pengeluaran.",
            "📥 **Ekspor & Impor Data Excel (.xlsx)**: Kelola data transaksi dalam format spreadsheet yang rapi.",
            "🔔 **Sistem Peringatan Anggaran**: Notifikasi otomatis saat pengeluaran kategori mencapai batas 80% & 100%.",
            "📧 **Layanan Reset Password**: Pengiriman token keamanan resmi via SMTP email.",
        ]
    }
];
</script>

<template>
    <div>
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
                    v-if="show"
                    class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8"
                    @click.self="close"
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
                            v-if="show"
                            class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <!-- Header -->
                            <div class="flex items-center justify-between mb-4">
                                <button
                                    @click="close"
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

                            <!-- Tabs -->
                            <div class="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800/60 mb-5">
                                <button
                                    @click="activeTab = 'ABOUT'"
                                    class="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                                    :class="activeTab === 'ABOUT' ? 'bg-white dark:bg-surface-900 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600'"
                                >
                                    Tentang App
                                </button>
                                <button
                                    @click="activeTab = 'CHANGELOG'"
                                    class="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                    :class="activeTab === 'CHANGELOG' ? 'bg-white dark:bg-surface-900 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-600'"
                                >
                                    <span>Catatan Rilis</span>
                                    <span class="w-2 h-2 rounded-full bg-primary-500"></span>
                                </button>
                            </div>

                            <!-- TAB 1: ABOUT INFO -->
                            <div v-if="activeTab === 'ABOUT'" class="text-center space-y-4 py-2 animate-fade-in">
                                <div
                                    class="w-20 h-20 flex items-center justify-center mx-auto drop-shadow-sm"
                                >
                                    <img src="/logo.png" alt="Logo" class="w-16 h-16 object-contain" />
                                </div>

                                <div>
                                    <h2
                                        class="text-xl font-black text-gray-800 dark:text-gray-100 tracking-tight"
                                    >
                                        CashPlow Budget Tracker
                                    </h2>
                                    <p
                                        class="text-xs font-bold text-primary-600 dark:text-primary-400 mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 dark:bg-primary-950/40 rounded-full"
                                    >
                                        <span>Versi 1.2.3</span>
                                        <span>✨ Rilis Terbaru</span>
                                    </p>
                                </div>

                                <div
                                    class="h-px bg-gray-100 dark:bg-gray-800 my-1"
                                ></div>

                                <p
                                    class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed text-left"
                                >
                                    CashPlow adalah aplikasi pencatat keuangan pribadi cerdas yang dirancang untuk membantu Anda mengontrol pengeluaran, memantau arus kas dompet, melunasi hutang, serta mewujudkan target tabungan impian dengan bantuan AI.
                                </p>

                                <div
                                    class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 text-left space-y-2.5 text-xs border border-gray-100 dark:border-gray-800"
                                >
                                    <div class="flex justify-between">
                                        <span class="text-gray-400">Pengembang</span>
                                        <span class="font-bold text-gray-700 dark:text-gray-200">CashPlow Team</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400">Teknologi</span>
                                        <span class="font-bold text-gray-700 dark:text-gray-200">Nuxt 4 • Tailwind • PostgreSQL</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400">AI Intelligence</span>
                                        <span class="font-bold text-primary-500">Google Gemini Flash</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-400">Lisensi</span>
                                        <span class="font-bold text-gray-700 dark:text-gray-200">MIT License</span>
                                    </div>
                                </div>

                                <p
                                    class="text-[11px] text-gray-400 dark:text-gray-600 pt-2"
                                >
                                    © 2026 CashPlow. All rights reserved.
                                </p>
                            </div>

                            <!-- TAB 2: CHANGELOG VIEWER -->
                            <div v-else class="space-y-4 py-2 animate-fade-in">
                                <div
                                    v-for="log in changelogs"
                                    :key="log.version"
                                    class="p-4 rounded-2xl border transition-all"
                                    :class="log.isLatest ? 'bg-primary-50/20 dark:bg-primary-950/20 border-primary-200 dark:border-primary-900/40' : 'bg-gray-50/60 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800'"
                                >
                                    <div class="flex items-center justify-between mb-2.5">
                                        <div class="flex items-center gap-2">
                                            <span class="font-black text-sm text-gray-800 dark:text-gray-100">{{ log.version }}</span>
                                            <span
                                                v-if="log.isLatest"
                                                class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary-500 text-white"
                                            >
                                                Terbaru
                                            </span>
                                        </div>
                                        <span class="text-[10px] text-gray-400 font-medium">{{ log.date }}</span>
                                    </div>

                                    <ul class="space-y-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                        <li
                                            v-for="(item, idx) in log.highlights"
                                            :key="idx"
                                            class="flex items-start gap-2"
                                        >
                                            <span class="text-primary-500 font-bold text-sm leading-tight">•</span>
                                            <span v-html="item.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')"></span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <button
                                @click="close"
                                class="w-full mt-4 py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95"
                            >
                                Tutup
                            </button>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

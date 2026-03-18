<script setup lang="ts">
useHead({ title: "Profil — CashPlow" });

// ── Color mode (dark / light / system) ────────────────────────
const colorMode = useColorMode();

const themeOptions = [
    { value: "system", label: "Ikuti Sistem", icon: "🖥️" },
    { value: "light", label: "Terang", icon: "☀️" },
    { value: "dark", label: "Gelap", icon: "🌙" },
] as const;

const setTheme = (val: string) => {
    colorMode.preference = val;
};

const isDark = computed(() => colorMode.value === "dark");

// ── Auth & User Data ───────────────────────────────────────────
const { user: authUser, logout } = useAuth();
const router = useRouter();

// ── Profile display data ───────────────────────────────────────
const userDisplay = computed(() => ({
    name: authUser.value?.name ?? "Pengguna",
    email: authUser.value?.email ?? "-",
    joined: authUser.value?.createdAt
        ? new Date(authUser.value.createdAt).toLocaleDateString("id-ID", {
              month: "long",
              year: "numeric",
          })
        : "-",
    avatar: authUser.value?.avatar ?? null,
    stats: authUser.value?.stats ?? {
        transactions: 0,
        categories: 0,
        wallets: 0,
        budgets: 0,
    },
}));

// ── Initials for avatar fallback ───────────────────────────────
const initials = computed(() =>
    userDisplay.value.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join(""),
);

// ── Quick stats ────────────────────────────────────────────────
const stats = computed(() => [
    {
        label: "Transaksi",
        value: userDisplay.value.stats.transactions,
        icon: "🧾",
    },
    {
        label: "Kategori",
        value: userDisplay.value.stats.categories,
        icon: "🏷️",
    },
    { label: "Dompet", value: userDisplay.value.stats.wallets, icon: "👛" },
    { label: "Budget", value: userDisplay.value.stats.budgets, icon: "🎯" },
]);

// ── Menu sections ──────────────────────────────────────────────
const accountMenus = [
    {
        icon: "👤",
        label: "Edit Profil",
        desc: "Ubah nama & info akun",
        action: "edit-profile",
        comingSoon: false,
    },
    {
        icon: "🔐",
        label: "Keamanan & Password",
        desc: "Ubah password akun",
        action: "security",
        comingSoon: false,
    },
    {
        icon: "🔔",
        label: "Notifikasi",
        desc: "Atur preferensi notifikasi",
        action: "notifications",
        comingSoon: true,
    },
    {
        icon: "💱",
        label: "Mata Uang",
        desc: "Rupiah (IDR)",
        action: "currency",
        comingSoon: false,
    },
];

const dataMenus = [
    {
        icon: "📤",
        label: "Export Data",
        desc: "Unduh data keuangan (Excel)",
        action: "export",
        comingSoon: false,
    },
    {
        icon: "📥",
        label: "Import Data",
        desc: "Impor transaksi dari file",
        action: "import",
        comingSoon: false,
    },
];

const appMenus = [
    {
        icon: "⭐",
        label: "Beri Rating",
        desc: "Nilai aplikasi ini",
        action: "rate",
        comingSoon: true,
    },
    {
        icon: "🐛",
        label: "Laporkan Bug",
        desc: "Temukan masalah? Beritahu kami",
        action: "bug",
        comingSoon: true,
    },
    {
        icon: "ℹ️",
        label: "Tentang App",
        desc: "Versi 1.0.0 — CashPlow Budget Tracker",
        action: "about",
        comingSoon: false,
    },
];

// ── Confirm logout modal ───────────────────────────────────────
const showLogoutModal = ref(false);

const handleLogout = async () => {
    try {
        await logout();
    } finally {
        showLogoutModal.value = false;
    }
};

// ── Reset Data States ──────────────────────────────────────────
const showResetModal = ref(false);
const resetConfirmText = ref("");
const isResetting = ref(false);

const handleResetData = async () => {
    if (resetConfirmText.value !== "HAPUS") return;

    isResetting.value = true;
    try {
        await $fetch("/api/auth/reset-data", { method: "POST" });
        // Successful reset, redirect to home to refresh state
        window.location.href = "/";
    } catch (err) {
        alert("Gagal menghapus data. Coba lagi.");
    } finally {
        isResetting.value = false;
        showResetModal.value = false;
    }
};

// ── Handle Action Clicks ───────────────────────────────────────
const handleAction = (action: string) => {
    if (
        [
            "edit-profile",
            "currency",
            "about",
            "security",
            "export",
            "import",
        ].includes(action)
    ) {
        router.push(`/profile/${action}`);
    } else if (action === "reset") {
        showResetModal.value = true;
    } else {
        // For others that might not be implemented yet
        alert(`Fitur ${action} sedang dalam tahap pengembangan!`);
    }
};
</script>

<template>
    <div class="space-y-5 animate-fade-in pb-4">
        <!-- ══════════════════════════════════════════════
         SECTION 1 — Profile Card
    ══════════════════════════════════════════════ -->
        <div class="card-gradient rounded-2xl p-5 relative overflow-hidden">
            <!-- Background blobs -->
            <div
                class="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none"
            />
            <div
                class="absolute -bottom-10 -left-4 w-28 h-28 rounded-full bg-black/10 pointer-events-none"
            />

            <div class="relative flex items-center gap-4">
                <!-- Avatar -->
                <div
                    class="relative w-18 h-18 flex-shrink-0 ring-4 ring-white/40 rounded-full overflow-hidden"
                    style="width: 4.5rem; height: 4.5rem"
                >
                    <img
                        v-if="userDisplay.avatar"
                        :src="userDisplay.avatar"
                        :alt="userDisplay.name"
                        class="w-full h-full object-cover"
                    />
                    <div
                        v-else
                        class="w-full h-full flex items-center justify-center bg-white/25 text-[#40513B] dark:text-white text-xl font-bold select-none"
                    >
                        {{ initials }}
                    </div>

                    <!-- Edit button overlay -->
                    <button
                        class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity duration-200 text-[#40513B] dark:text-white text-xs font-semibold"
                        aria-label="Ganti foto profil"
                        @click="handleAction('edit-profile')"
                    >
                        📷
                    </button>
                </div>

                <!-- Name & email -->
                <div class="flex-1 min-w-0">
                    <h2
                        class="text-[#40513B] dark:text-white font-bold text-lg leading-tight truncate"
                    >
                        {{ userDisplay.name }}
                    </h2>
                    <p
                        class="text-[#40513B]/80 dark:text-white/70 text-xs font-medium mt-0.5 truncate"
                    >
                        {{ userDisplay.email }}
                    </p>
                    <p
                        class="text-[#40513B]/75 dark:text-white/50 text-[11px] mt-1"
                    >
                        Bergabung {{ userDisplay.joined }}
                    </p>
                </div>

                <!-- Edit icon button -->
                <button
                    class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-[#40513B] dark:text-white text-base transition-all duration-200 active:scale-90"
                    aria-label="Edit profil"
                    @click="handleAction('edit-profile')"
                >
                    ✏️
                </button>
            </div>

            <!-- Quick stats row -->
            <div
                class="relative grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/20"
            >
                <div
                    v-for="stat in stats"
                    :key="stat.label"
                    class="flex flex-col items-center gap-1"
                >
                    <span class="text-lg leading-none">{{ stat.icon }}</span>
                    <span
                        class="text-[#40513B] dark:text-white font-extrabold text-sm leading-none"
                        >{{ stat.value }}</span
                    >
                    <span
                        class="text-[#40513B]/80 dark:text-white/60 text-[9px] font-medium uppercase tracking-wide"
                        >{{ stat.label }}</span
                    >
                </div>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════
         SECTION 2 — Tampilan (Dark Mode)
    ══════════════════════════════════════════════ -->
        <div class="card rounded-2xl overflow-hidden">
            <!-- Header -->
            <div class="flex items-center gap-3 px-4 pt-4 pb-3">
                <span
                    class="flex items-center justify-center w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-lg"
                >
                    🎨
                </span>
                <div>
                    <h3
                        class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                    >
                        Tampilan
                    </h3>
                    <p class="text-[11px] text-gray-400 dark:text-gray-500">
                        Atur tema aplikasi
                    </p>
                </div>
            </div>

            <div class="divider" />

            <!-- Theme selector -->
            <div class="px-4 py-4 space-y-3">
                <!-- Theme pill buttons -->
                <div class="grid grid-cols-3 gap-2">
                    <button
                        v-for="opt in themeOptions"
                        :key="opt.value"
                        class="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-xs font-semibold transition-all duration-200 active:scale-95 border-2"
                        :class="
                            colorMode.preference === opt.value
                                ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'
                        "
                        @click="setTheme(opt.value)"
                    >
                        <span class="text-xl leading-none">{{ opt.icon }}</span>
                        <span>{{ opt.label }}</span>

                        <!-- Active check -->
                        <span
                            v-if="colorMode.preference === opt.value"
                            class="w-4 h-4 rounded-full flex items-center justify-center bg-primary-500 text-white text-[9px] font-bold"
                        >
                            ✓
                        </span>
                    </button>
                </div>

                <!-- Current state indicator -->
                <div
                    class="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60"
                >
                    <span
                        class="text-xs text-gray-500 dark:text-gray-400 font-medium"
                    >
                        Mode aktif sekarang
                    </span>
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm">{{ isDark ? "🌙" : "☀️" }}</span>
                        <span
                            class="text-xs font-bold text-gray-700 dark:text-gray-200"
                        >
                            {{ isDark ? "Gelap" : "Terang" }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════
         SECTION 3 — Akun
    ══════════════════════════════════════════════ -->
        <div class="card rounded-2xl overflow-hidden">
            <!-- Header -->
            <div class="flex items-center gap-3 px-4 pt-4 pb-3">
                <span
                    class="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-lg"
                >
                    ⚙️
                </span>
                <div>
                    <h3
                        class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                    >
                        Pengaturan Akun
                    </h3>
                    <p class="text-[11px] text-gray-400 dark:text-gray-500">
                        Profil, keamanan & preferensi
                    </p>
                </div>
            </div>

            <div class="divider" />

            <!-- Menu items -->
            <div class="divide-y divide-gray-100 dark:divide-gray-800/70">
                <button
                    v-for="menu in accountMenus"
                    :key="menu.action"
                    @click="handleAction(menu.action)"
                    class="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors duration-150 text-left"
                >
                    <!-- Icon -->
                    <span
                        class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-base leading-none"
                    >
                        {{ menu.icon }}
                    </span>

                    <!-- Label + desc -->
                    <div class="flex-1 min-w-0">
                        <p
                            class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ menu.label }}
                        </p>
                        <p
                            class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate"
                        >
                            {{ menu.desc }}
                        </p>
                    </div>

                    <!-- Badge / chevron -->
                    <div class="flex-shrink-0 flex items-center gap-1.5">
                        <span
                            v-if="menu.comingSoon"
                            class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        >
                            Soon
                        </span>
                        <svg
                            class="w-4 h-4 text-gray-300 dark:text-gray-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════
         SECTION 4 — Data & Privasi
    ══════════════════════════════════════════════ -->
        <div class="card rounded-2xl overflow-hidden">
            <!-- Header -->
            <div class="flex items-center gap-3 px-4 pt-4 pb-3">
                <span
                    class="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-lg"
                >
                    💾
                </span>
                <div>
                    <h3
                        class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                    >
                        Data & Privasi
                    </h3>
                    <p class="text-[11px] text-gray-400 dark:text-gray-500">
                        Kelola data keuangan kamu
                    </p>
                </div>
            </div>

            <div class="divider" />

            <div class="divide-y divide-gray-100 dark:divide-gray-800/70">
                <button
                    v-for="menu in dataMenus"
                    :key="menu.action"
                    @click="handleAction(menu.action)"
                    class="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors duration-150 text-left"
                >
                    <span
                        class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-base leading-none"
                    >
                        {{ menu.icon }}
                    </span>
                    <div class="flex-1 min-w-0">
                        <p
                            class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ menu.label }}
                        </p>
                        <p
                            class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate"
                        >
                            {{ menu.desc }}
                        </p>
                    </div>
                    <div class="flex-shrink-0 flex items-center gap-1.5">
                        <span
                            v-if="menu.comingSoon"
                            class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        >
                            Soon
                        </span>
                        <svg
                            class="w-4 h-4 text-gray-300 dark:text-gray-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════
         SECTION 5 — Tentang App
    ══════════════════════════════════════════════ -->
        <div class="card rounded-2xl overflow-hidden">
            <div class="flex items-center gap-3 px-4 pt-4 pb-3">
                <span
                    class="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-lg"
                >
                    📱
                </span>
                <div>
                    <h3
                        class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                    >
                        Tentang Aplikasi
                    </h3>
                    <p class="text-[11px] text-gray-400 dark:text-gray-500">
                        Informasi & dukungan
                    </p>
                </div>
            </div>

            <div class="divider" />

            <div class="divide-y divide-gray-100 dark:divide-gray-800/70">
                <button
                    v-for="menu in appMenus"
                    :key="menu.action"
                    @click="handleAction(menu.action)"
                    class="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors duration-150 text-left"
                >
                    <span
                        class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-base leading-none"
                    >
                        {{ menu.icon }}
                    </span>
                    <div class="flex-1 min-w-0">
                        <p
                            class="text-sm font-semibold text-gray-800 dark:text-gray-100"
                        >
                            {{ menu.label }}
                        </p>
                        <p
                            class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate"
                        >
                            {{ menu.desc }}
                        </p>
                    </div>
                    <div class="flex-shrink-0 flex items-center gap-1.5">
                        <span
                            v-if="menu.comingSoon"
                            class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        >
                            Soon
                        </span>
                        <svg
                            class="w-4 h-4 text-gray-300 dark:text-gray-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>

        <!-- ══════════════════════════════════════════════
         SECTION 6 — Danger Zone
    ══════════════════════════════════════════════ -->
        <div
            class="card rounded-2xl overflow-hidden border border-rose-100 dark:border-rose-900/20"
        >
            <button
                @click="handleAction('reset')"
                class="w-full flex items-center gap-3 px-4 py-4 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left"
            >
                <span
                    class="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-base"
                >
                    🗑️
                </span>
                <div class="flex-1">
                    <p
                        class="text-sm font-bold text-rose-600 dark:text-rose-400"
                    >
                        Hapus Semua Data
                    </p>
                    <p class="text-[10px] text-rose-400 dark:text-rose-500/70">
                        Reset permanen semua catatan keuangan
                    </p>
                </div>
                <svg
                    class="w-4 h-4 text-rose-300"
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

        <!-- ══════════════════════════════════════════════
         SECTION 7 — Logout
    ══════════════════════════════════════════════ -->
        <button
            class="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all duration-150"
            @click="showLogoutModal = true"
        >
            <svg
                class="w-4.5 h-4.5"
                style="width: 1.125rem; height: 1.125rem"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Keluar dari Akun
        </button>

        <!-- App version footer -->
        <div class="flex flex-col items-center gap-1 pb-2">
            <div class="flex items-center gap-2">
                <span
                    class="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-black"
                >
                    P
                </span>
                <span class="text-sm font-bold text-gradient">CashPlow</span>
            </div>
            <p class="text-[10px] text-gray-300 dark:text-gray-600 font-medium">
                Budget Tracker · v1.0.0
            </p>
            <p class="text-[10px] text-gray-300 dark:text-gray-600">
                © 2025 CashPlow. All rights reserved.
            </p>
        </div>

        <!-- ══════════════════════════════════════════════
         NESTED PAGES (Edit Profile, Currency, About)
    ══════════════════════════════════════════════ -->
        <NuxtPage />

        <!-- ══════════════════════════════════════════════
         LOGOUT CONFIRMATION MODAL
    ══════════════════════════════════════════════ -->
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
                    v-if="showLogoutModal"
                    class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8"
                    @click.self="showLogoutModal = false"
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
                            v-if="showLogoutModal"
                            class="w-full max-w-app card rounded-3xl p-6 flex flex-col items-center text-center gap-4"
                        >
                            <!-- Icon -->
                            <div
                                class="w-16 h-16 rounded-full flex items-center justify-center bg-rose-100 dark:bg-rose-950/50 text-3xl"
                            >
                                👋
                            </div>

                            <!-- Text -->
                            <div>
                                <h3
                                    class="text-base font-bold text-gray-800 dark:text-gray-100"
                                >
                                    Keluar dari CashPlow?
                                </h3>
                                <p
                                    class="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-[240px] mx-auto"
                                >
                                    Kamu akan keluar dari akun ini. Data kamu
                                    tetap aman dan tersimpan.
                                </p>
                            </div>

                            <!-- Buttons -->
                            <div class="flex gap-3 w-full">
                                <button
                                    class="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all duration-150"
                                    @click="showLogoutModal = false"
                                >
                                    Batal
                                </button>
                                <button
                                    class="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold active:scale-95 transition-all duration-150 shadow-lg shadow-rose-500/30"
                                    @click="handleLogout"
                                >
                                    Ya, Keluar
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>

        <!-- ══════════════════════════════════════════════
         RESET DATA CONFIRMATION MODAL
    ══════════════════════════════════════════════ -->
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
                    v-if="showResetModal"
                    class="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-md px-4 pb-8"
                    @click.self="!isResetting && (showResetModal = false)"
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
                            v-if="showResetModal"
                            class="w-full max-w-app card rounded-3xl p-6 flex flex-col items-center text-center gap-5 border-2 border-rose-500/20 shadow-2xl"
                        >
                            <!-- Icon -->
                            <div
                                class="w-20 h-20 rounded-full flex items-center justify-center bg-rose-100 dark:bg-rose-950/50 text-4xl animate-pulse"
                            >
                                ⚠️
                            </div>

                            <!-- Text -->
                            <div class="space-y-2">
                                <h3
                                    class="text-xl font-black text-rose-600 dark:text-rose-400"
                                >
                                    Hapus Semua Data?
                                </h3>
                                <p
                                    class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed"
                                >
                                    Tindakan ini akan menghapus
                                    <b>seluruh</b> transaksi, dompet, dan budget
                                    secara permanen. Data yang sudah dihapus
                                    <b>tidak bisa dikembalikan</b>.
                                </p>
                            </div>

                            <!-- Input Validation -->
                            <div class="w-full space-y-2 pt-2">
                                <p
                                    class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                                >
                                    Ketik
                                    <span class="text-rose-500">HAPUS</span>
                                    untuk konfirmasi
                                </p>
                                <input
                                    v-model="resetConfirmText"
                                    type="text"
                                    placeholder="Ketik di sini..."
                                    class="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-rose-100 dark:border-rose-900/30 text-center font-black tracking-widest text-rose-600 outline-none focus:border-rose-500 transition-all"
                                    :disabled="isResetting"
                                />
                            </div>

                            <!-- Buttons -->
                            <div class="flex flex-col gap-3 w-full">
                                <button
                                    class="w-full py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-black active:scale-95 transition-all duration-150 shadow-lg shadow-rose-500/30 disabled:opacity-50 flex items-center justify-center gap-3"
                                    :disabled="
                                        resetConfirmText !== 'HAPUS' ||
                                        isResetting
                                    "
                                    @click="handleResetData"
                                >
                                    <div
                                        v-if="isResetting"
                                        class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                    ></div>
                                    <span>{{
                                        isResetting
                                            ? "Sedang Menghapus..."
                                            : "YA, HAPUS SEMUA"
                                    }}</span>
                                </button>
                                <button
                                    class="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    @click="showResetModal = false"
                                    :disabled="isResetting"
                                >
                                    Batalkan
                                </button>
                            </div>
                        </div>
                    </Transition>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

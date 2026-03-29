<script setup lang="ts">
import { BellIcon, BellDotIcon } from "lucide-vue-next";

// ── Props ──────────────────────────────────────────────────────
interface Props {
    userName?: string;
    avatarUrl?: string;
    hasNotification?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    userName: "Pengguna",
    avatarUrl: undefined,
    hasNotification: false,
});

// ── Greeting based on time ─────────────────────────────────────
const greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
});

const greetingEmoji = computed(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "☀️";
    if (hour >= 11 && hour < 15) return "🌤️";
    if (hour >= 15 && hour < 18) return "🌅";
    return "🌙";
});

// ── First name only ────────────────────────────────────────────
const firstName = computed(() => {
    return props.userName.split(" ")[0];
});

// ── Avatar fallback (initials) ────────────────────────────────
const initials = computed(() => {
    return props.userName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("");
});

// ── Date display ───────────────────────────────────────────────
const { formatDateFull } = useDate();
const todayLabel = computed(() => formatDateFull(new Date()));
</script>

<template>
    <header
        class="sticky top-0 z-40 w-full max-w-app mx-auto glass border-b border-gray-100 dark:border-gray-800/60"
    >
        <div class="page-wrapper">
            <div class="flex items-center justify-between h-16 p-2.5">
                <!-- ── Left: Greeting + date ────────────────────────── -->
                <div class="flex items-center gap-3">
                    <!-- Logo -->
                    <img
                        src="/logo.png"
                        alt="Logo"
                        class="w-8 h-8 object-contain"
                    />

                    <div class="flex flex-col justify-center min-w-0">
                        <p
                            class="text-xs font-medium text-gray-400 dark:text-gray-500 truncate"
                        >
                            {{ todayLabel }}
                        </p>
                        <h1
                            class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-1 truncate"
                        >
                            {{ greeting }},
                            <span class="text-gradient font-bold">{{
                                firstName
                            }}</span>
                            <span class="text-base leading-none">{{
                                greetingEmoji
                            }}</span>
                        </h1>
                    </div>
                </div>

                <!-- ── Right: Notification + Avatar ─────────────────── -->
                <div class="flex items-center gap-2 flex-shrink-0">
                    <!-- Notification Bell -->
                    <button
                        class="relative btn-icon rounded-full text-gray-500 dark:text-gray-400"
                        aria-label="Notifikasi"
                    >
                        <component
                            :is="hasNotification ? BellDotIcon : BellIcon"
                            :size="22"
                            class="transition-colors duration-200"
                            :class="hasNotification ? 'text-primary-500' : ''"
                        />
                        <!-- Red dot badge -->
                        <span
                            v-if="hasNotification"
                            class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-gray-900"
                        />
                    </button>

                    <!-- Avatar -->
                    <NuxtLink
                        to="/profile"
                        class="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary-400 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 transition-all duration-200 active:scale-90"
                        aria-label="Profil saya"
                    >
                        <!-- Image avatar -->
                        <img
                            v-if="avatarUrl"
                            :src="avatarUrl"
                            :alt="userName"
                            class="w-full h-full object-cover"
                        />

                        <!-- Initials fallback -->
                        <span
                            v-else
                            class="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold select-none"
                        >
                            {{ initials }}
                        </span>
                    </NuxtLink>
                </div>
            </div>
        </div>
    </header>
</template>

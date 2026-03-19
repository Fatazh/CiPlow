<script setup lang="ts">
// components/ui/PwaInstallPrompt.vue
// Shows an elegant install prompt banner for PWA

const show = ref(false);
const deferredPrompt = ref<any>(null);

// Only show on client
if (import.meta.client) {
    // Check if already installed
    const isInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

    if (!isInstalled) {
        // Listen for the beforeinstallprompt event
        window.addEventListener("beforeinstallprompt", (e: Event) => {
            e.preventDefault();
            deferredPrompt.value = e;

            // Check if user dismissed before (localStorage)
            const dismissed = localStorage.getItem("CashPlow-pwa-dismissed");
            if (!dismissed) {
                // Show prompt after 10 seconds (don't interrupt immediately)
                setTimeout(() => {
                    show.value = true;
                }, 10000);
            }
        });
    }
}

const install = async () => {
    if (!deferredPrompt.value) return;
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    if (outcome === "accepted") {
        show.value = false;
    }
    deferredPrompt.value = null;
};

const dismiss = () => {
    show.value = false;
    localStorage.setItem("CashPlow-pwa-dismissed", Date.now().toString());
};
</script>

<template>
    <Transition
        enter-active-class="transition-all duration-500 ease-out"
        enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-full opacity-0"
    >
        <div
            v-if="show"
            class="fixed bottom-20 left-3 right-3 z-[80] rounded-2xl overflow-hidden bg-white dark:bg-surface-900 shadow-2xl shadow-gray-900/20 dark:shadow-black/40 border border-gray-100 dark:border-gray-800"
        >
            <!-- Gradient accent bar -->
            <div
                class="h-1 bg-gradient-to-r from-emerald-400 via-primary-500 to-blue-500"
            />

            <div class="p-4">
                <div class="flex items-start gap-3">
                    <!-- App icon -->
                    <div
                        class="w-12 h-12 rounded-xl flex-shrink-0 bg-white dark:bg-surface-800 flex items-center justify-center shadow-lg shadow-emerald-500/30 overflow-hidden p-1"
                    >
                        <img src="/logo.png" alt="App Logo" class="w-full h-full object-contain" />
                    </div>

                    <div class="flex-1 min-w-0">
                        <h3
                            class="text-sm font-bold text-gray-800 dark:text-gray-100"
                        >
                            Install CashPlow
                        </h3>
                        <p
                            class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed"
                        >
                            Akses cepat dari home screen, tampilan fullscreen,
                            bisa offline!
                        </p>
                    </div>

                    <!-- Close -->
                    <button
                        class="flex-shrink-0 p-1 -mt-1 -mr-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 transition-colors"
                        @click="dismiss"
                    >
                        <svg
                            class="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 mt-3">
                    <button
                        class="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 active:scale-95"
                        @click="dismiss"
                    >
                        Nanti saja
                    </button>
                    <button
                        class="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
                        @click="install"
                    >
                        <svg
                            class="w-4 h-4"
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
                        Install
                    </button>
                </div>
            </div>
        </div>
    </Transition>
</template>

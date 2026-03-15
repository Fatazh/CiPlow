<script setup lang="ts">
// components/ui/OfflineIndicator.vue
// Shows a persistent banner when the user is offline

const isOnline = useOnline()

const showBanner = computed(() => !isOnline.value)

// Track when we came back online (for "reconnected" toast)
const justReconnected = ref(false)

watch(isOnline, (online, wasOnline) => {
  if (online && wasOnline === false) {
    justReconnected.value = true
    setTimeout(() => (justReconnected.value = false), 3000)
  }
})
</script>

<template>
  <!-- Offline banner -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showBanner"
      class="
        fixed bottom-20 left-4 right-4 z-[90]
        flex items-center gap-3
        px-4 py-3 rounded-2xl
        bg-gray-900 dark:bg-gray-800
        shadow-xl shadow-gray-900/30
        border border-gray-700/50
      "
    >
      <!-- Pulse dot -->
      <span class="relative flex-shrink-0">
        <span class="absolute inline-flex w-3 h-3 rounded-full bg-amber-400 opacity-75 animate-ping" />
        <span class="relative inline-flex w-3 h-3 rounded-full bg-amber-500" />
      </span>

      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-white">Kamu sedang offline</p>
        <p class="text-[11px] text-gray-400 mt-0.5">
          Data terakhir masih tersedia. Koneksi diperlukan untuk menyimpan perubahan.
        </p>
      </div>

      <!-- Offline icon -->
      <svg
        class="w-5 h-5 text-amber-400 flex-shrink-0"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      >
        <path d="m2 2 20 20" />
        <path d="M8.5 16.5a5 5 0 0 1 7 0" />
        <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
        <path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76" />
        <path d="M16.85 11.25a10 10 0 0 1 2.22 1.68" />
        <path d="M5 13a10 10 0 0 1 5.24-2.76" />
        <line x1="12" x2="12.01" y1="20" y2="20" />
      </svg>
    </div>
  </Transition>

  <!-- Reconnected toast -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="justReconnected"
      class="
        fixed bottom-20 left-4 right-4 z-[90]
        flex items-center gap-3
        px-4 py-3 rounded-2xl
        bg-emerald-600
        shadow-xl shadow-emerald-600/30
      "
    >
      <span class="text-lg">🟢</span>
      <div class="flex-1">
        <p class="text-sm font-semibold text-white">Kembali online!</p>
        <p class="text-[11px] text-emerald-100 mt-0.5">Koneksi berhasil dipulihkan</p>
      </div>
    </div>
  </Transition>
</template>

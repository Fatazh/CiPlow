<script setup lang="ts">
// Default layout — wraps every page with Header + main scroll area + BottomNav

const { user } = useAuth()
const { syncTransactions } = useOfflineSync()
const route = useRoute()
const mainScrollEl = ref<HTMLElement | null>(null)

// Initial sync on mount
onMounted(() => {
  syncTransactions()
})

watch(
  () => route.fullPath,
  async () => {
    await nextTick()
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    mainScrollEl.value?.scrollTo({ top: 0, behavior: 'auto' })
  },
  { flush: 'post' }
)
</script>

<template>
  <div
    class="
      relative min-h-screen
      bg-gray-50 dark:bg-surface-950
      transition-colors duration-300
    "
  >
    <!-- ── Top Header ─────────────────────────────────────── -->
    <AppHeader
      :user-name="user?.name ?? 'User'"
      :avatar-url="user?.avatar ?? undefined"
      :has-notification="true"
    />

    <!-- ── Scrollable Page Content ────────────────────────── -->
    <main
      ref="mainScrollEl"
      class="
        w-full max-w-app mx-auto
        px-4
        pt-4 pb-28
        min-h-[calc(100vh-4rem)]
        overflow-y-auto
      "
    >
      <!-- Page transition -->
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-250 ease-out"
        enter-from-class="opacity-0 translate-y-3"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <slot />
      </Transition>
    </main>

    <!-- ── Bottom Navigation ───────────────────────────────── -->
    <BottomNav />

    <!-- ── PWA: Offline indicator + Install prompt ────────── -->
    <OfflineIndicator />
    <PwaInstallPrompt />
  </div>
</template>

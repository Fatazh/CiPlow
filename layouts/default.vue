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
      <slot />
    </main>

    <!-- ── Bottom Navigation ───────────────────────────────── -->
    <BottomNav />

    <!-- ── PWA: Offline indicator + Install prompt ────────── -->
    <OfflineIndicator />
    <PwaInstallPrompt />
  </div>
</template>

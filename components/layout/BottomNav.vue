<script setup lang="ts">
import {
  HomeIcon,
  BarChart3Icon,
  PlusIcon,
  DatabaseIcon,
  UserIcon,
} from 'lucide-vue-next'

import type { FunctionalComponent } from 'vue'
import type { LucideProps } from 'lucide-vue-next'

// ── Route awareness ────────────────────────────────────────────
const route = useRoute()

interface NavItem {
  id: string
  label: string
  icon: FunctionalComponent<LucideProps>
  to: string
  exact: boolean
}

const navItems: [NavItem, NavItem, NavItem, NavItem] = [
  {
    id: 'home',
    label: 'Beranda',
    icon: HomeIcon as any,
    to: '/',
    exact: true,
  },
  {
    id: 'analytics',
    label: 'Analitik',
    icon: BarChart3Icon as any,
    to: '/analytics',
    exact: false,
  },
  // Center FAB placeholder — handled separately
  {
    id: 'master',
    label: 'Master',
    icon: DatabaseIcon as any,
    to: '/master-data',
    exact: false,
  },
  {
    id: 'profile',
    label: 'Profil',
    icon: UserIcon as any,
    to: '/profile',
    exact: false,
  },
]

const isActive = (item: NavItem): boolean => {
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}

// ── FAB emit ───────────────────────────────────────────────────
const emit = defineEmits<{ fabClick: [] }>()

// ── FAB pressed animation ──────────────────────────────────────
const fabPressed = ref(false)

const onFabClick = () => {
  fabPressed.value = true
  setTimeout(() => (fabPressed.value = false), 200)
  emit('fabClick')
  // Navigate to add transaction page
  navigateTo('/add-transaction')
}
</script>

<template>
  <!--
    Bottom Navigation Bar
    Floating grouped layout:
    [Home] - [ Analytics | FAB | Master ] - [Profile]
  -->
  <nav
    class="
      fixed bottom-4 inset-x-0 z-50
      w-full max-w-app mx-auto
      px-4
      pb-safe
      pointer-events-none
    "
  >
    <div class="flex items-center justify-between gap-3 h-[4.5rem]">

      <!-- ── Left (Home) ─────────────────────────────────────── -->
      <NuxtLink
        :to="navItems[0].to"
        class="
          nav-item w-16 h-full flex-shrink-0
          glass rounded-3xl
          border border-gray-100 dark:border-gray-800/70
          shadow-card
          pointer-events-auto
          flex flex-col items-center justify-center
        "
        :class="{ active: isActive(navItems[0]) }"
        :aria-label="navItems[0].label"
      >
        <span
          class="
            relative flex items-center justify-center
            w-10 h-7 rounded-xl
            transition-all duration-200
          "
          :class="isActive(navItems[0]) ? 'text-primary-500' : 'text-gray-400'"
        >
          <component
            :is="navItems[0].icon"
            :size="24"
            :stroke-width="isActive(navItems[0]) ? 2.5 : 2"
            class="transition-all duration-200"
          />
        </span>
      </NuxtLink>

      <!-- ── Center Group (Analytics, FAB, Master) ───────────── -->
      <div
        class="
          flex-1 h-full
          glass rounded-[2rem]
          border border-gray-100 dark:border-gray-800/70
          shadow-card
          pointer-events-auto
          flex items-center justify-around px-2
          relative
        "
      >
        <!-- Analytics -->
        <NuxtLink
          :to="navItems[1].to"
          class="nav-item flex flex-col items-center justify-center w-16"
          :class="{ active: isActive(navItems[1]) }"
          :aria-label="navItems[1].label"
        >
          <span
            class="transition-all duration-200"
            :class="isActive(navItems[1]) ? 'text-primary-500 scale-110' : 'text-gray-400 hover:text-gray-600'"
          >
            <component
              :is="navItems[1].icon"
              :size="24"
              :stroke-width="isActive(navItems[1]) ? 2.5 : 2"
            />
          </span>
        </NuxtLink>

        <!-- Center FAB -->
        <div class="flex justify-center items-center relative w-16">
          <button
            class="
              absolute -top-7
              w-[3.75rem] h-[3.75rem] rounded-full
              text-white
              shadow-fab
              flex items-center justify-center
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2
              focus:ring-offset-white dark:focus:ring-offset-gray-900
              overflow-hidden
            "
            :class="[
              fabPressed ? 'scale-90' : 'scale-100 hover:scale-105 active:scale-90',
            ]"
            style="background-image: linear-gradient(135deg, #10b981 0%, #0d9488 100%);"
            aria-label="Tambah transaksi"
            @click="onFabClick"
          >
            <!-- Ring decoration -->
            <span
              class="
                absolute inset-0 rounded-full
                ring-4 ring-white/20
              "
            />

            <!-- Plus icon -->
            <PlusIcon
              :size="28"
              :stroke-width="2.5"
              class="relative z-10 transition-transform duration-200"
              :class="fabPressed ? 'rotate-45' : 'rotate-0'"
            />
          </button>
        </div>

        <!-- Master -->
        <NuxtLink
          :to="navItems[2].to"
          class="nav-item flex flex-col items-center justify-center w-16"
          :class="{ active: isActive(navItems[2]) }"
          :aria-label="navItems[2].label"
        >
          <span
            class="transition-all duration-200"
            :class="isActive(navItems[2]) ? 'text-primary-500 scale-110' : 'text-gray-400 hover:text-gray-600'"
          >
            <component
              :is="navItems[2].icon"
              :size="24"
              :stroke-width="isActive(navItems[2]) ? 2.5 : 2"
            />
          </span>
        </NuxtLink>
      </div>

      <!-- ── Right (Profile) ─────────────────────────────────── -->
      <NuxtLink
        :to="navItems[3].to"
        class="
          nav-item w-16 h-full flex-shrink-0
          glass rounded-3xl
          border border-gray-100 dark:border-gray-800/70
          shadow-card
          pointer-events-auto
          flex flex-col items-center justify-center
        "
        :class="{ active: isActive(navItems[3]) }"
        :aria-label="navItems[3].label"
      >
        <span
          class="
            relative flex items-center justify-center
            w-10 h-7 rounded-xl
            transition-all duration-200
          "
          :class="isActive(navItems[3]) ? 'text-primary-500' : 'text-gray-400'"
        >
          <component
            :is="navItems[3].icon"
            :size="24"
            :stroke-width="isActive(navItems[3]) ? 2.5 : 2"
            class="transition-all duration-200"
          />
        </span>
      </NuxtLink>

    </div>
  </nav>
</template>

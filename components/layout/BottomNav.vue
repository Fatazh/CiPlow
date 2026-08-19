<script setup lang="ts">
import {
  HomeIcon,
  BarChart3Icon,
  PlusIcon,
  DatabaseIcon,
  UserIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  ArrowLeftRightIcon,
  CameraIcon,
  CalculatorIcon,
  XIcon
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

// ── FAB Speed Dial State ───────────────────────────────────────
const isSpeedDialOpen = ref(false)
const showSplitBillModal = ref(false)
const fabPressed = ref(false)

const onFabClick = () => {
  fabPressed.value = true
  triggerHaptic('medium')
  setTimeout(() => (fabPressed.value = false), 150)
  isSpeedDialOpen.value = !isSpeedDialOpen.value
}

const closeSpeedDial = () => {
  isSpeedDialOpen.value = false
}

const navigateAction = (path: string) => {
  triggerHaptic('light')
  closeSpeedDial()
  navigateTo(path)
}

const openSplitBill = () => {
  triggerHaptic('light')
  closeSpeedDial()
  showSplitBillModal.value = true
}
</script>

<template>
  <!-- ── Speed Dial Backdrop & Actions Overlay ────────────────── -->
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
        v-if="isSpeedDialOpen"
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center pb-28 px-4"
        @click.self="closeSpeedDial"
      >
        <div class="w-full max-w-[320px] space-y-2.5 animate-slide-up select-none">
          <!-- Item 1: Catat Pengeluaran -->
          <button
            type="button"
            class="w-full p-3.5 rounded-2xl bg-white dark:bg-surface-900 shadow-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group active:scale-98 transition-all"
            @click="navigateAction('/add-transaction?type=EXPENSE')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 transition-transform">
                💸
              </div>
              <div class="text-left">
                <div class="text-xs font-black text-gray-800 dark:text-gray-100">Catat Pengeluaran</div>
                <div class="text-[10px] text-gray-400">Belanja, makan, tagihan</div>
              </div>
            </div>
            <span class="text-xs font-bold text-rose-500">Baru →</span>
          </button>

          <!-- Item 2: Catat Pemasukan -->
          <button
            type="button"
            class="w-full p-3.5 rounded-2xl bg-white dark:bg-surface-900 shadow-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group active:scale-98 transition-all"
            @click="navigateAction('/add-transaction?type=INCOME')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 transition-transform">
                💰
              </div>
              <div class="text-left">
                <div class="text-xs font-black text-gray-800 dark:text-gray-100">Catat Pemasukan</div>
                <div class="text-[10px] text-gray-400">Gaji, bonus, profit</div>
              </div>
            </div>
            <span class="text-xs font-bold text-emerald-500">Baru →</span>
          </button>

          <!-- Item 3: Transfer Antar Dompet -->
          <button
            type="button"
            class="w-full p-3.5 rounded-2xl bg-white dark:bg-surface-900 shadow-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group active:scale-98 transition-all"
            @click="navigateAction('/add-transaction?type=TRANSFER')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 transition-transform">
                🔄
              </div>
              <div class="text-left">
                <div class="text-xs font-black text-gray-800 dark:text-gray-100">Transfer Dompet</div>
                <div class="text-[10px] text-gray-400">Tarik tunai, top-up e-wallet</div>
              </div>
            </div>
            <span class="text-xs font-bold text-blue-500">Pindah →</span>
          </button>

          <!-- Item 4: Scan Struk AI -->
          <button
            type="button"
            class="w-full p-3.5 rounded-2xl bg-white dark:bg-surface-900 shadow-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group active:scale-98 transition-all"
            @click="navigateAction('/add-transaction?action=scan')"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 transition-transform">
                🧾
              </div>
              <div class="text-left">
                <div class="text-xs font-black text-gray-800 dark:text-gray-100">Scan Struk AI</div>
                <div class="text-[10px] text-gray-400">Otomatis baca nota belanja</div>
              </div>
            </div>
            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600">AI Gemini</span>
          </button>

          <!-- Item 5: Split Bill -->
          <button
            type="button"
            class="w-full p-3.5 rounded-2xl bg-white dark:bg-surface-900 shadow-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between group active:scale-98 transition-all"
            @click="openSplitBill"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg shadow-xs group-hover:scale-110 transition-transform">
                🧮
              </div>
              <div class="text-left">
                <div class="text-xs font-black text-gray-800 dark:text-gray-100">Bagi Tagihan (Split Bill)</div>
                <div class="text-[10px] text-gray-400">Hitung & catat talangan piutang</div>
              </div>
            </div>
            <span class="text-xs font-bold text-amber-500">Buka →</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Split Bill Modal Instance ────────────────────────────── -->
  <SplitBillModal
    v-model="showSplitBillModal"
  />

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
        @click="triggerHaptic('light')"
      >
        <span
          class="
            relative flex items-center justify-center
            w-10 h-7 rounded-xl
            transition-all duration-200
          "
          :class="isActive(navItems[0]) ? 'text-primary-500 scale-110' : 'text-gray-400'"
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
          @click="triggerHaptic('light')"
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
              fabPressed ? 'scale-90' : isSpeedDialOpen ? 'scale-105 ring-4 ring-primary-400/40' : 'scale-100 hover:scale-105 active:scale-90',
              'bg-gradient-to-tr from-primary-600 to-primary-400 shadow-primary-500/30'
            ]"
            aria-label="Tambah transaksi atau menu pintas"
            @click="onFabClick"
          >
            <!-- Ring decoration -->
            <span
              class="
                absolute inset-0 rounded-full
                ring-4 ring-white/20
              "
            />

            <!-- Plus / Close icon -->
            <PlusIcon
              :size="28"
              :stroke-width="2.5"
              class="relative z-10 transition-transform duration-300 ease-out"
              :class="isSpeedDialOpen ? 'rotate-45 scale-110' : 'rotate-0 scale-100'"
            />
          </button>
        </div>

        <!-- Master -->
        <NuxtLink
          :to="navItems[2].to"
          class="nav-item flex flex-col items-center justify-center w-16"
          :class="{ active: isActive(navItems[2]) }"
          :aria-label="navItems[2].label"
          @click="triggerHaptic('light')"
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
        @click="triggerHaptic('light')"
      >
        <span
          class="
            relative flex items-center justify-center
            w-10 h-7 rounded-xl
            transition-all duration-200
          "
          :class="isActive(navItems[3]) ? 'text-primary-500 scale-110' : 'text-gray-400'"
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

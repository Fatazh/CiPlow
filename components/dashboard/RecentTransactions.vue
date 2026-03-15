<script setup lang="ts">
import { ChevronRightIcon, ArrowDownLeftIcon, ArrowUpRightIcon, ArrowLeftRightIcon, ReceiptIcon } from 'lucide-vue-next'

// ── Types ──────────────────────────────────────────────────────
interface Transaction {
  id: string
  description: string
  notes?: string | null
  category: string
  categoryIcon: string
  categoryColor: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  date: string
  wallet: string
  walletIcon: string
}

// ── Props ──────────────────────────────────────────────────────
interface Props {
  transactions?: Transaction[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  transactions: () => [],
  loading: false,
})

// ── Composables ────────────────────────────────────────────────
const { formatIDR } = useCurrency()
const { formatSmart } = useDate()

// ── Helpers ────────────────────────────────────────────────────
const typeConfig = (type: Transaction['type']) => {
  switch (type) {
    case 'INCOME':
      return {
        icon: ArrowDownLeftIcon,
        sign: '+',
        amountClass: 'text-emerald-500 dark:text-emerald-400',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        label: 'Pemasukan',
      }
    case 'EXPENSE':
      return {
        icon: ArrowUpRightIcon,
        sign: '-',
        amountClass: 'text-rose-500 dark:text-rose-400',
        iconBg: 'bg-rose-100 dark:bg-rose-950/60',
        iconColor: 'text-rose-500 dark:text-rose-400',
        label: 'Pengeluaran',
      }
    case 'TRANSFER':
    default:
      return {
        icon: ArrowLeftRightIcon,
        sign: '',
        amountClass: 'text-blue-500 dark:text-blue-400',
        iconBg: 'bg-blue-100 dark:bg-blue-950/60',
        iconColor: 'text-blue-500 dark:text-blue-400',
        label: 'Transfer',
      }
  }
}

// ── Pressed state for tap feedback ────────────────────────────
const pressedId = ref<string | null>(null)

const onPress = (id: string) => {
  pressedId.value = id
  setTimeout(() => (pressedId.value = null), 200)
}
</script>

<template>
  <!-- ── Skeleton ────────────────────────────────────────────── -->
  <div v-if="loading" class="card rounded-2xl p-4 animate-pulse">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>

    <!-- Items -->
    <div class="space-y-4">
      <div
        v-for="i in 5"
        :key="i"
        class="flex items-center gap-3"
      >
        <!-- Icon -->
        <div class="w-11 h-11 rounded-2xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

        <!-- Text lines -->
        <div class="flex-1 space-y-1.5">
          <div
            class="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-full"
            :style="{ width: `${55 + i * 7}%` }"
          />
          <div
            class="h-3 bg-gray-100 dark:bg-gray-800 rounded-full"
            :style="{ width: `${35 + i * 5}%` }"
          />
        </div>

        <!-- Amount -->
        <div class="space-y-1.5 flex flex-col items-end">
          <div class="h-3.5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div class="h-3 w-14 bg-gray-100 dark:bg-gray-800 rounded-full" />
        </div>
      </div>
    </div>
  </div>

  <!-- ── Card ───────────────────────────────────────────────── -->
  <div
    v-else
    class="card rounded-2xl overflow-hidden animate-fade-in"
    style="animation-delay: 200ms;"
  >

    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="flex items-center justify-between px-4 pt-4 pb-3">
      <div>
        <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Transaksi Terbaru
        </h3>
        <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          5 transaksi terakhir
        </p>
      </div>

      <NuxtLink
        to="/transactions"
        class="
          flex items-center gap-0.5
          text-xs font-semibold text-primary-500
          hover:text-primary-600
          transition-colors duration-150
          active:opacity-70
        "
      >
        Lihat semua
        <ChevronRightIcon :size="14" :stroke-width="2.5" />
      </NuxtLink>
    </div>

    <!-- ── Divider ─────────────────────────────────────────── -->
    <div class="divider" />

    <!-- ── Empty state ─────────────────────────────────────── -->
    <div
      v-if="!transactions.length"
      class="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <span
        class="
          flex items-center justify-center
          w-16 h-16 rounded-full
          bg-gray-100 dark:bg-gray-800
          text-gray-400
          mb-3
        "
      >
        <ReceiptIcon :size="28" :stroke-width="1.5" />
      </span>
      <p class="text-sm font-semibold text-gray-600 dark:text-gray-300">
        Belum ada transaksi
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-[200px]">
        Tekan tombol <span class="font-semibold text-primary-500">+</span> untuk menambahkan transaksi pertama kamu
      </p>
    </div>

    <!-- ── Transaction list ─────────────────────────────────── -->
    <div v-else class="divide-y divide-gray-100 dark:divide-gray-800/80">
      <button
        v-for="(tx, index) in transactions"
        :key="tx.id"
        class="
          w-full flex items-center gap-3
          px-4 py-3.5
          transition-all duration-150
          text-left
          active:bg-gray-50 dark:active:bg-gray-800/60
        "
        :class="[
          pressedId === tx.id ? 'bg-gray-50 dark:bg-gray-800/60 scale-[0.98]' : '',
          'animate-slide-up',
        ]"
        :style="{ animationDelay: `${index * 60}ms` }"
        :aria-label="`${tx.description} — ${tx.type === 'INCOME' ? '+' : '-'} ${formatIDR(tx.amount)}`"
        @click="onPress(tx.id)"
      >

        <!-- ── Category Icon ──────────────────────────────── -->
        <div class="relative flex-shrink-0">
          <!-- Category emoji background -->
          <span
            class="
              flex items-center justify-center
              w-11 h-11 rounded-2xl
              text-xl leading-none
              transition-transform duration-150
            "
            :class="[
              pressedId === tx.id ? 'scale-90' : '',
            ]"
            :style="{
              backgroundColor: `${tx.categoryColor}1a`,
            }"
          >
            {{ tx.categoryIcon }}
          </span>

          <!-- Transaction type indicator badge -->
          <span
            class="
              absolute -bottom-0.5 -right-0.5
              flex items-center justify-center
              w-4 h-4 rounded-full
              ring-2 ring-white dark:ring-gray-900
            "
            :class="typeConfig(tx.type).iconBg"
          >
            <component
              :is="typeConfig(tx.type).icon"
              :size="9"
              :stroke-width="2.8"
              :class="typeConfig(tx.type).iconColor"
            />
          </span>
        </div>

        <!-- ── Description + meta ────────────────────────── -->
        <div class="flex-1 min-w-0">
          <!-- Description -->
          <p
            class="
              text-sm font-semibold
              text-gray-800 dark:text-gray-100
              leading-tight truncate
            "
          >
            {{ tx.description }}
          </p>

          <!-- Category + Wallet row -->
          <div class="flex items-center gap-1.5 mt-1">
            <!-- Category chip -->
            <span
              class="
                inline-flex items-center
                text-[10px] font-medium
                px-1.5 py-0.5 rounded-full
                flex-shrink-0 truncate max-w-[120px]
              "
              :style="{
                backgroundColor: `${tx.categoryColor}1a`,
                color: tx.categoryColor,
              }"
            >
              {{ tx.category }}
            </span>

            <!-- Separator dot -->
            <span class="text-gray-300 dark:text-gray-600 text-[10px]">•</span>

            <!-- Wallet with icon -->
            <span class="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate flex items-center gap-0.5">
              <span class="text-[11px] leading-none">{{ tx.walletIcon }}</span>
              {{ tx.wallet }}
            </span>
          </div>
        </div>

        <!-- ── Amount + Date ──────────────────────────────── -->
        <div class="flex flex-col items-end flex-shrink-0 gap-0.5 ml-2">
          <!-- Amount with sign -->
          <p
            class="text-sm font-bold leading-tight"
            :class="typeConfig(tx.type).amountClass"
          >
            {{ typeConfig(tx.type).sign }}{{ formatIDR(tx.amount) }}
          </p>

          <!-- Smart date -->
          <p class="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
            {{ formatSmart(tx.date) }}
          </p>
        </div>

      </button>
    </div>

    <!-- ── Footer: CTA to add transaction ──────────────────── -->
    <div
      v-if="transactions.length > 0"
      class="px-4 pb-4 pt-3"
    >
      <NuxtLink
        to="/transactions"
        class="
          flex items-center justify-center
          w-full py-2.5 rounded-xl
          text-xs font-semibold
          text-primary-600 dark:text-primary-400
          bg-primary-50 dark:bg-primary-950/30
          hover:bg-primary-100 dark:hover:bg-primary-950/50
          border border-primary-100 dark:border-primary-900/50
          transition-all duration-150
          active:scale-98
        "
      >
        Lihat Semua Transaksi
        <ChevronRightIcon :size="14" :stroke-width="2.5" class="ml-1" />
      </NuxtLink>
    </div>

  </div>
</template>

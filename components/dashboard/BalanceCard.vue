<script setup lang="ts">
import { EyeIcon, EyeOffIcon, TrendingUpIcon, TrendingDownIcon, WalletIcon } from 'lucide-vue-next'

// ── Props ──────────────────────────────────────────────────────
interface Wallet {
  id: string
  name: string
  type: string
  balance: number
  color: string
  icon: string
}

interface Props {
  total?: number
  lastMonth?: number
  changePercent?: number
  isPositive?: boolean
  period?: string
  wallets?: Wallet[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  total: 0,
  lastMonth: 0,
  changePercent: 0,
  isPositive: true,
  period: '',
  wallets: () => [],
  loading: false,
})

// ── Currency ────────────────────────────────────────────────────
const { formatIDR, formatCompact } = useCurrency()

// ── Balance visibility toggle ──────────────────────────────────
const isVisible = ref(true)
const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}

// ── Masked balance display ─────────────────────────────────────
const maskedAmount = '••••••••'

// ── Displayed balance ──────────────────────────────────────────
const displayBalance = computed(() =>
  isVisible.value ? formatIDR(props.total) : maskedAmount,
)

// ── Change label ───────────────────────────────────────────────
const changeLabel = computed(() => {
  const sign = props.isPositive ? '+' : ''
  return `${sign}${props.changePercent.toFixed(1)}%`
})

// ── Wallet type label ──────────────────────────────────────────
const walletTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    BANK: 'Bank',
    CASH: 'Tunai',
    E_WALLET: 'e-Wallet',
    INVESTMENT: 'Investasi',
    OTHER: 'Lainnya',
  }
  return map[type] ?? type
}
</script>

<template>
  <!-- ── Skeleton ────────────────────────────────────────────── -->
  <div
    v-if="loading"
    class="card-gradient rounded-2xl p-5 animate-pulse"
    style="min-height: 200px;"
  >
    <div class="space-y-3">
      <div class="h-3 w-28 bg-white/30 rounded-full" />
      <div class="h-9 w-48 bg-white/30 rounded-full" />
      <div class="h-4 w-20 bg-white/20 rounded-full" />
      <div class="flex gap-2 mt-4">
        <div class="h-7 w-24 bg-white/20 rounded-full" />
        <div class="h-7 w-20 bg-white/20 rounded-full" />
        <div class="h-7 w-20 bg-white/20 rounded-full" />
      </div>
    </div>
  </div>

  <!-- ── Card ───────────────────────────────────────────────── -->
  <div
    v-else
    class="card-gradient rounded-2xl overflow-hidden select-none"
  >
    <!-- ── Top decoration circles ─────────────────────────── -->
    <div class="relative p-5 overflow-hidden">
      <!-- Decorative blobs -->
      <div
        class="
          absolute -top-10 -right-10
          w-40 h-40 rounded-full
          bg-white/10
          pointer-events-none
        "
      />
      <div
        class="
          absolute -bottom-14 -left-6
          w-36 h-36 rounded-full
          bg-black/10
          pointer-events-none
        "
      />
      <div
        class="
          absolute top-6 right-20
          w-16 h-16 rounded-full
          bg-white/5
          pointer-events-none
        "
      />

      <!-- ── Header row ─────────────────────────────────────── -->
      <div class="relative flex items-start justify-between mb-1">
        <!-- Label + period -->
        <div>
          <p class="text-white/70 text-xs font-medium tracking-wide uppercase">
            Saldo Total
          </p>
          <p class="text-white/50 text-[11px] mt-0.5">
            {{ period }}
          </p>
        </div>

        <!-- Visibility toggle -->
        <button
          class="
            flex items-center justify-center
            w-8 h-8 rounded-full
            bg-white/15 hover:bg-white/25
            text-white/80
            transition-all duration-200
            active:scale-90
            -mt-0.5
          "
          :aria-label="isVisible ? 'Sembunyikan saldo' : 'Tampilkan saldo'"
          @click="toggleVisibility"
        >
          <EyeOffIcon v-if="isVisible" :size="16" :stroke-width="2" />
          <EyeIcon v-else :size="16" :stroke-width="2" />
        </button>
      </div>

      <!-- ── Balance amount ────────────────────────────────── -->
      <div class="relative mt-2 mb-3">
        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <p
            :key="isVisible ? 'shown' : 'hidden'"
            class="
              text-white font-bold tracking-tight
              leading-none
            "
            :class="isVisible ? 'text-3xl' : 'text-2xl tracking-widest'"
          >
            {{ displayBalance }}
          </p>
        </Transition>
      </div>

      <!-- ── Change vs last month ──────────────────────────── -->
      <div class="relative flex items-center gap-1.5 mb-4">
        <span
          class="
            flex items-center gap-1
            px-2 py-0.5 rounded-full
            text-xs font-semibold
          "
          :class="
            isPositive
              ? 'bg-white/20 text-white'
              : 'bg-rose-400/30 text-rose-100'
          "
        >
          <TrendingUpIcon
            v-if="isPositive"
            :size="12"
            :stroke-width="2.5"
          />
          <TrendingDownIcon
            v-else
            :size="12"
            :stroke-width="2.5"
          />
          {{ changeLabel }}
        </span>

        <span class="text-white/50 text-[11px]">
          vs bulan lalu
        </span>
      </div>

      <!-- ── Divider ────────────────────────────────────────── -->
      <div class="relative w-full h-px bg-white/15 mb-4" />

      <!-- ── Wallet chips ───────────────────────────────────── -->
      <div
        v-if="wallets.length > 0"
        class="relative"
      >
        <p class="text-white/50 text-[10px] uppercase tracking-wide font-medium mb-2">
          Dompet Saya
        </p>

        <!-- Horizontal scroll on mobile -->
        <div
          class="
            flex items-center gap-2
            overflow-x-auto no-scrollbar
            pb-0.5
          "
        >
          <div
            v-for="wallet in wallets"
            :key="wallet.id"
            class="
              flex items-center gap-1.5
              flex-shrink-0
              bg-white/15 hover:bg-white/25
              rounded-full
              px-3 py-1.5
              cursor-pointer
              transition-all duration-150
              active:scale-95
            "
          >
            <!-- Wallet icon -->
            <span class="text-sm leading-none">{{ wallet.icon }}</span>

            <div class="flex flex-col">
              <span class="text-white/70 text-[9px] font-medium leading-none mb-0.5">
                {{ wallet.name }}
              </span>
              <span class="text-white text-[11px] font-semibold leading-none">
                <template v-if="isVisible">
                  {{ formatCompact(wallet.balance) }}
                </template>
                <template v-else>
                  ••••
                </template>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty wallets ────────────────────────────────── -->
      <div
        v-else
        class="
          relative flex items-center gap-2
          text-white/50 text-xs
        "
      >
        <WalletIcon :size="14" :stroke-width="1.8" />
        <span>Belum ada dompet — tambahkan di Master Data</span>
      </div>

    </div>
  </div>
</template>

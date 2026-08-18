<script setup lang="ts">
// pages/debts/index.vue — Debts & Loans Management (Hutang & Piutang)
import { evaluateMathExpression } from '~/composables/useMathEvaluator'

useHead({ title: "Hutang & Piutang — CashPlow" })

const router = useRouter()
const { formatIDR } = useCurrency()

// Active filter tab: ALL | LEND | BORROW | PAID
const activeTab = ref<'ALL' | 'LEND' | 'BORROW' | 'PAID'>('ALL')

// Fetch debts data & wallets
const { data: debtsData, refresh: refreshDebts, status } = await useFetch('/api/debts', {
  key: 'debts-list',
  lazy: false,
})
const { data: walletsData } = await useFetch('/api/wallets', {
  key: 'debts-wallets',
})

const isLoading = computed(() => status.value === 'pending')
const debts = computed<any[]>(() => (debtsData.value as any)?.data?.items ?? [])
const summary = computed(() => (debtsData.value as any)?.data?.summary ?? {
  totalLend: 0,
  totalLendRemaining: 0,
  totalBorrow: 0,
  totalBorrowRemaining: 0,
})
const wallets = computed<any[]>(() => (walletsData.value as any)?.data ?? [])

// Filtered items
const filteredDebts = computed(() => {
  if (activeTab.value === 'LEND') {
    return debts.value.filter((d) => d.type === 'LEND' && d.status !== 'PAID')
  }
  if (activeTab.value === 'BORROW') {
    return debts.value.filter((d) => d.type === 'BORROW' && d.status !== 'PAID')
  }
  if (activeTab.value === 'PAID') {
    return debts.value.filter((d) => d.status === 'PAID')
  }
  return debts.value
})

// Modals
const showFormModal = ref(false)
const selectedDebtForEdit = ref<any>(null)
const showPayModal = ref(false)
const selectedDebtForPay = ref<any>(null)

// Toast
const toast = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

const handleOpenCreate = (type: 'LEND' | 'BORROW' = 'LEND') => {
  selectedDebtForEdit.value = { type }
  showFormModal.value = true
}

const handleEdit = (debt: any) => {
  selectedDebtForEdit.value = debt
  showFormModal.value = true
}

const handleOpenPay = (debt: any) => {
  selectedDebtForPay.value = debt
  showPayModal.value = true
}

const handleDelete = async (debt: any) => {
  if (confirm(`Apakah Anda yakin ingin menghapus catatan ${debt.type === 'LEND' ? 'piutang' : 'hutang'} ${debt.personName}?`)) {
    try {
      await $fetch(`/api/debts/${debt.id}`, { method: 'DELETE' })
      toast.message = 'Catatan berhasil dihapus'
      toast.type = 'success'
      toast.show = true
      await refreshDebts()
    } catch (err: any) {
      toast.message = err?.data?.message || 'Gagal menghapus catatan'
      toast.type = 'error'
      toast.show = true
    }
  }
}

const handleSaved = async () => {
  await refreshDebts()
}

const handlePaySuccess = async (msg: string) => {
  toast.message = msg
  toast.type = 'success'
  toast.show = true
  await refreshDebts()
}
</script>

<template>
  <div class="space-y-4 animate-fade-in pb-12">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button class="btn-icon w-9 h-9" @click="router.push('/')">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">
            Hutang & Piutang
          </h2>
          <p class="text-xs text-gray-400">
            Kelola pinjaman dan penagihan
          </p>
        </div>
      </div>

      <!-- Add Buttons -->
      <div class="flex items-center gap-1.5">
        <button
          @click="handleOpenCreate('LEND')"
          class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-1"
        >
          <span>➕</span>
          <span>Catat Baru</span>
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 gap-3">
      <!-- Piutang Card -->
      <div class="card rounded-2xl p-4 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-surface-900 border border-emerald-100 dark:border-emerald-900/30">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            🤝 Total Piutang
          </span>
          <span class="text-xs">💰</span>
        </div>
        <p class="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
          {{ formatIDR(summary.totalLendRemaining) }}
        </p>
        <p class="text-[10px] text-gray-400 mt-0.5">
          Uang Anda di orang lain
        </p>
      </div>

      <!-- Hutang Card -->
      <div class="card rounded-2xl p-4 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-surface-900 border border-rose-100 dark:border-rose-900/30">
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-wider text-rose-500">
            💳 Total Hutang
          </span>
          <span class="text-xs">⚠️</span>
        </div>
        <p class="text-lg font-black text-rose-500 mt-1">
          {{ formatIDR(summary.totalBorrowRemaining) }}
        </p>
        <p class="text-[10px] text-gray-400 mt-0.5">
          Uang yang harus Anda bayar
        </p>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800 text-xs font-bold">
      <button
        v-for="t in [
          { key: 'ALL', label: 'Semua' },
          { key: 'LEND', label: '🤝 Piutang' },
          { key: 'BORROW', label: '💳 Hutang' },
          { key: 'PAID', label: '✓ Lunas' },
        ]"
        :key="t.key"
        @click="activeTab = t.key as any"
        class="flex-1 py-2 rounded-xl transition-all"
        :class="activeTab === t.key ? 'bg-white dark:bg-surface-900 shadow-sm text-gray-800 dark:text-gray-100' : 'text-gray-400'"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Debts List -->
    <div v-if="filteredDebts.length === 0" class="card rounded-2xl p-8 text-center space-y-2 border border-dashed border-gray-200 dark:border-gray-800">
      <span class="text-3xl">✨</span>
      <p class="text-sm font-bold text-gray-700 dark:text-gray-200">
        Tidak ada catatan {{ activeTab === 'LEND' ? 'piutang' : (activeTab === 'BORROW' ? 'hutang' : '') }}
      </p>
      <p class="text-xs text-gray-400 max-w-xs mx-auto">
        Semua transaksi pinjaman Anda rapi dan tercatat dengan baik di sini.
      </p>
      <button
        @click="handleOpenCreate()"
        class="btn-primary text-xs py-2 px-4 mx-auto mt-2"
      >
        ➕ Catat Hutang / Piutang
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in filteredDebts"
        :key="item.id"
        class="card rounded-2xl p-4 transition-all duration-200 border relative overflow-hidden"
        :class="item.status === 'PAID' ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10' : 'border-gray-100 dark:border-gray-800'"
      >
        <!-- Card Top -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              :class="item.type === 'LEND' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-500'"
            >
              {{ item.type === 'LEND' ? '🤝' : '💳' }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {{ item.personName }}
                </h4>
                <span
                  class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md"
                  :class="item.type === 'LEND' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'"
                >
                  {{ item.type === 'LEND' ? 'Piutang' : 'Hutang' }}
                </span>
              </div>
              <p v-if="item.dueDate" class="text-[10px] text-gray-400 mt-0.5">
                📅 Jatuh Tempo: {{ new Date(item.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
              </p>
              <p v-else class="text-[10px] text-gray-400 mt-0.5">
                Tanpa batas jatuh tempo
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5">
            <span
              v-if="item.status === 'PAID'"
              class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
            >
              Lunas ✓
            </span>
            <button
              @click="handleEdit(item)"
              class="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-xs"
              title="Edit"
            >
              ✏️
            </button>
            <button
              @click="handleDelete(item)"
              class="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center text-xs"
              title="Hapus"
            >
              🗑️
            </button>
          </div>
        </div>

        <!-- Progress & Amounts -->
        <div class="mt-3.5 space-y-1.5">
          <div class="flex items-baseline justify-between text-xs">
            <div>
              <span class="text-sm font-black text-gray-800 dark:text-gray-100">
                {{ formatIDR(item.paidAmount) }}
              </span>
              <span class="text-[10px] text-gray-400 ml-1">
                / {{ formatIDR(item.totalAmount) }}
              </span>
            </div>
            <span class="font-bold text-xs" :class="item.percentage === 100 ? 'text-emerald-500' : 'text-gray-500'">
              {{ item.percentage }}%
            </span>
          </div>

          <!-- Bar -->
          <div class="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="item.type === 'LEND' ? 'bg-emerald-500' : 'bg-rose-500'"
              :style="{ width: `${item.percentage}%` }"
            />
          </div>
        </div>

        <!-- Notes if any -->
        <p v-if="item.notes" class="text-[11px] text-gray-400 mt-2.5 bg-gray-50 dark:bg-gray-800/40 p-2 rounded-xl">
          💬 {{ item.notes }}
        </p>

        <!-- Bottom Action / Sisa Tagihan -->
        <div class="mt-3 flex items-center justify-between pt-2.5 border-t border-gray-50 dark:border-gray-800/60">
          <span class="text-[11px] text-gray-400 font-medium">
            {{ item.remainingAmount > 0 ? `Sisa: ${formatIDR(item.remainingAmount)}` : 'Sudah lunas seluruhnya' }}
          </span>

          <button
            v-if="item.status !== 'PAID'"
            @click="handleOpenPay(item)"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
            :class="item.type === 'LEND' ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600'"
          >
            <span>💵</span>
            <span>{{ item.type === 'LEND' ? 'Terima Pembayaran' : 'Bayar Cicilan' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <DebtsFormModal
      :show="showFormModal"
      :debt="selectedDebtForEdit"
      :wallets="wallets"
      @close="showFormModal = false"
      @saved="handleSaved"
    />

    <DebtsPayModal
      :show="showPayModal"
      :debt="selectedDebtForPay"
      :wallets="wallets"
      @close="showPayModal = false"
      @success="handlePaySuccess"
    />

    <!-- Toast -->
    <Toast
      v-model="toast.show"
      :message="toast.message"
      :type="toast.type"
    />
  </div>
</template>

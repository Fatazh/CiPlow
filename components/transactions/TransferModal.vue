<script setup lang="ts">
// components/transactions/TransferModal.vue — Dedicated Modal for Transfer Between Wallets
import { ref, reactive, computed, watch } from 'vue'
import {
  XIcon,
  ArrowUpDownIcon,
  ArrowRightIcon,
  CalendarIcon,
  CreditCardIcon,
  CheckIcon
} from 'lucide-vue-next'
import { evaluateMathExpression } from '~/composables/useMathEvaluator'
import { triggerHaptic } from '~/utils/haptics'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [result: any]
}>()

const { formatIDR } = useCurrency()

// ── Fetch Wallets & Categories ─────────────────────────────────
const { data: walletsRaw, refresh: refreshWallets } = await useFetch('/api/wallets', {
  key: 'transfer-modal-wallets',
})
const { data: categoriesRaw, refresh: refreshCategories } = await useFetch('/api/categories', {
  key: 'transfer-modal-categories',
})

const wallets = computed(() => walletsRaw.value?.data ?? [])
const allCategories = computed(() => categoriesRaw.value?.data ?? [])

// ── Form State ────────────────────────────────────────────────
const form = reactive({
  walletFromId: '',
  walletToId: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  notes: '',
})

const amountDisplay = ref('')
const loading = ref(false)
const errorMessage = ref('')

const amountMath = computed(() => evaluateMathExpression(amountDisplay.value))

const onAmountInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  const sanitized = val.replace(/[^0-9+\-*/().\s]/g, '')
  amountDisplay.value = sanitized
  const math = evaluateMathExpression(sanitized)
  if (math.isValid && math.result !== null) {
    form.amount = math.result
  }
}

const onAmountBlur = () => {
  const math = evaluateMathExpression(amountDisplay.value)
  if (math.isValid && math.result !== null && math.result > 0) {
    form.amount = math.result
    amountDisplay.value = math.result.toLocaleString('id-ID')
  } else if (!amountDisplay.value || form.amount === 0) {
    form.amount = 0
    amountDisplay.value = ''
  }
}

// ── Reset & Initialize ─────────────────────────────────────────
const resetForm = () => {
  errorMessage.value = ''
  form.amount = 0
  amountDisplay.value = ''
  form.notes = ''
  form.date = new Date().toISOString().split('T')[0]

  if (wallets.value.length >= 2 && wallets.value[0] && wallets.value[1]) {
    form.walletFromId = wallets.value[0].id
    form.walletToId = wallets.value[1].id
  } else if (wallets.value.length === 1 && wallets.value[0]) {
    form.walletFromId = wallets.value[0].id
    form.walletToId = ''
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      refreshWallets()
      refreshCategories()
      resetForm()
    }
  },
  { immediate: true }
)

const swapWallets = () => {
  const temp = form.walletFromId
  form.walletFromId = form.walletToId
  form.walletToId = temp
  triggerHaptic('medium')
}

const sourceWallet = computed(() => {
  return wallets.value.find((w: any) => w.id === form.walletFromId)
})

const targetWallet = computed(() => {
  return wallets.value.find((w: any) => w.id === form.walletToId)
})

const hasInsufficientBalance = computed(() => {
  if (!sourceWallet.value || form.amount <= 0) return false
  return Number(sourceWallet.value.balance) < form.amount
})

const closeModal = () => {
  if (loading.value) return
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!form.walletFromId) {
    errorMessage.value = 'Pilih dompet asal'
    return
  }
  if (!form.walletToId) {
    errorMessage.value = 'Pilih dompet tujuan'
    return
  }
  if (form.walletFromId === form.walletToId) {
    errorMessage.value = 'Dompet asal dan dompet tujuan tidak boleh sama'
    return
  }
  if (form.amount <= 0) {
    errorMessage.value = 'Nominal transfer harus lebih dari 0'
    return
  }

  // Find a category for transfer
  let transferCatId = ''
  const transferCat = allCategories.value.find(
    (c: any) => c.name.toLowerCase().includes('transfer') || c.name.toLowerCase().includes('lainnya')
  )
  if (transferCat) {
    transferCatId = transferCat.id
  } else if (allCategories.value.length > 0 && allCategories.value[0]) {
    transferCatId = allCategories.value[0].id
  }

  try {
    loading.value = true
    errorMessage.value = ''
    triggerHaptic('medium')

    const fromName = sourceWallet.value?.name || 'Dompet Asal'
    const toName = targetWallet.value?.name || 'Dompet Tujuan'
    const description = `Transfer dari ${fromName} ke ${toName}`

    const payload = {
      amount: form.amount,
      type: 'TRANSFER',
      categoryId: transferCatId,
      walletFromId: form.walletFromId,
      walletToId: form.walletToId,
      description,
      notes: form.notes.trim() || undefined,
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
    }

    const res: any = await $fetch('/api/transactions', {
      method: 'POST',
      body: payload,
    })

    triggerHaptic('success')
    emit('saved', res)
    closeModal()
    refreshNuxtData()
  } catch (err: any) {
    errorMessage.value = err?.data?.message || err?.message || 'Gagal melakukan transfer dompet'
    triggerHaptic('error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      @click.self="closeModal"
    >
      <div
        class="bg-white dark:bg-surface-900 w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col animate-slide-up sm:animate-scale-up overflow-hidden"
      >
        <!-- ── Header ─────────────────────────────────────────── -->
        <div class="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-blue-500/5 shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center text-xl shadow-xs">
              🔄
            </div>
            <div>
              <h3 class="text-base font-extrabold text-gray-800 dark:text-gray-100">
                Transfer Antar Dompet
              </h3>
              <p class="text-[11px] text-gray-400">
                Pindahkan saldo, top-up e-wallet, atau tarik tunai
              </p>
            </div>
          </div>
          <button
            type="button"
            @click="closeModal"
            class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- ── Form Body (Scrollable) ─────────────────────────── -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2"
          >
            <span>⚠️</span>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Dompet Asal & Tujuan with Swap Button -->
          <div class="space-y-3 relative">
            <!-- Dompet Asal -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                📤 Dari Dompet (Sumber)
              </label>
              <select
                v-model="form.walletFromId"
                class="w-full px-3.5 py-3 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="" disabled>Pilih Dompet Asal</option>
                <option
                  v-for="w in wallets"
                  :key="w.id"
                  :value="w.id"
                  :disabled="w.id === form.walletToId"
                >
                  {{ w.icon }} {{ w.name }} — Saldo: {{ formatIDR(w.balance) }}
                </option>
              </select>
            </div>

            <!-- Swap Button -->
            <div class="flex justify-center -my-1">
              <button
                type="button"
                @click="swapWallets"
                class="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all"
                title="Tukar Dompet Asal & Tujuan"
              >
                <ArrowUpDownIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Dompet Tujuan -->
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                📥 Ke Dompet (Tujuan)
              </label>
              <select
                v-model="form.walletToId"
                class="w-full px-3.5 py-3 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                <option value="" disabled>Pilih Dompet Tujuan</option>
                <option
                  v-for="w in wallets"
                  :key="w.id"
                  :value="w.id"
                  :disabled="w.id === form.walletFromId"
                >
                  {{ w.icon }} {{ w.name }} — Saldo: {{ formatIDR(w.balance) }}
                </option>
              </select>
            </div>
          </div>

          <!-- Nominal Transfer -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                💵 Nominal Transfer (Rp)
              </label>
              <span v-if="amountMath.isExpression" class="text-[10px] font-semibold text-blue-500">
                = Rp {{ (amountMath.result || 0).toLocaleString('id-ID') }}
              </span>
            </div>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                Rp
              </span>
              <input
                :value="amountDisplay"
                type="text"
                inputmode="text"
                @input="onAmountInput"
                @blur="onAmountBlur"
                class="w-full pl-11 pr-3.5 py-3 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-lg font-black text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="0 / contoh: 50000+2500"
              />
            </div>
            <p v-if="hasInsufficientBalance" class="text-[11px] text-amber-500 font-semibold mt-1">
              ⚠️ Nominal melebihi saldo dompet asal ({{ formatIDR(sourceWallet?.balance || 0) }}).
            </p>
          </div>

          <!-- Date Input -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              📅 Tanggal
            </label>
            <input
              v-model="form.date"
              type="date"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              📝 Catatan (Opsional)
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full px-3.5 py-2 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="misal: Top up GoPay, bayar parkir e-money..."
            />
          </div>
        </div>

        <!-- ── Footer Actions ─────────────────────────────────── -->
        <div class="p-4 bg-gray-50/80 dark:bg-surface-800/80 border-t border-gray-100 dark:border-gray-800 flex gap-2.5 shrink-0">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 font-bold text-xs transition-all active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            @click="handleSubmit"
            :disabled="loading"
            class="flex-1 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="animate-spin text-sm">⏳</span>
            <span>{{ loading ? 'Memproses Transfer...' : 'Kirim Transfer' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 4px;
}
</style>

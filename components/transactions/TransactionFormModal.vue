<script setup lang="ts">
// components/transactions/TransactionFormModal.vue — Dedicated Modal for Add Expense & Add Income
import { ref, reactive, computed, watch } from 'vue'
import {
  XIcon,
  PlusIcon,
  TagIcon,
  CalendarIcon,
  CreditCardIcon,
  LayersIcon,
  SparklesIcon,
  PercentIcon,
  CameraIcon,
  Trash2Icon,
  CheckIcon
} from 'lucide-vue-next'
import { evaluateMathExpression } from '~/composables/useMathEvaluator'
import { compressImage } from '~/utils/imageCompressor'
import { triggerHaptic } from '~/utils/haptics'

const props = defineProps<{
  modelValue: boolean
  type: 'EXPENSE' | 'INCOME'
  initialData?: {
    merchant?: string
    totalAmount?: number
    date?: string
    matchedCategoryId?: string | null
    suggestedCategory?: string
    items?: Array<{ name: string; quantity: number; unitPrice: number }>
    notes?: string
  } | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': [result: any]
}>()

const { formatIDR } = useCurrency()

// ── Fetch Wallets & Categories ─────────────────────────────────
const { data: walletsRaw, refresh: refreshWallets } = await useFetch('/api/wallets', {
  key: 'modal-wallets',
})
const { data: categoriesRaw, refresh: refreshCategories } = await useFetch('/api/categories', {
  key: 'modal-categories',
})

const wallets = computed(() => walletsRaw.value?.data ?? [])
const allCategories = computed(() => categoriesRaw.value?.data ?? [])

const filteredCategories = computed(() => {
  return allCategories.value.filter((c: any) => c.type === props.type)
})

// ── Form State ────────────────────────────────────────────────
const form = reactive({
  amount: 0,
  categoryId: '',
  walletId: '',
  description: '',
  notes: '',
  date: new Date().toISOString().split('T')[0],
  // Detail Fields for Expense
  quantity: 1,
  unitPrice: 0,
  // Promo Fields
  isPromo: false,
  promoType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y',
  promoValue: 0,
  promoDetails: '',
  // Tags & Receipt
  tags: [] as string[],
  receiptImage: '',
})

const amountDisplay = ref('')
const unitPriceDisplay = ref('')
const promoValueDisplay = ref('')
const tagInput = ref('')
const loading = ref(false)
const errorMessage = ref('')
const receiptFileInput = ref<HTMLInputElement | null>(null)

// ── Math Calculations ─────────────────────────────────────────
const amountMath = computed(() => evaluateMathExpression(amountDisplay.value))
const unitPriceMath = computed(() => evaluateMathExpression(unitPriceDisplay.value))

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

const onUnitPriceInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  const sanitized = val.replace(/[^0-9+\-*/().\s]/g, '')
  unitPriceDisplay.value = sanitized
  const math = evaluateMathExpression(sanitized)
  if (math.isValid && math.result !== null) {
    form.unitPrice = math.result
  }
}

const onUnitPriceBlur = () => {
  const math = evaluateMathExpression(unitPriceDisplay.value)
  if (math.isValid && math.result !== null && math.result > 0) {
    form.unitPrice = math.result
    unitPriceDisplay.value = math.result.toLocaleString('id-ID')
  } else if (!unitPriceDisplay.value || form.unitPrice === 0) {
    form.unitPrice = 0
    unitPriceDisplay.value = ''
  }
}

// Auto-calculate Expense amount from Qty x Price & Promo
watch(
  [
    () => form.quantity,
    () => form.unitPrice,
    () => form.isPromo,
    () => form.promoType,
    () => form.promoValue,
  ],
  ([qty, price, isPromo, pType, pValue]) => {
    if (props.type === 'EXPENSE') {
      let total = qty * price
      if (isPromo) {
        if (pType === 'PERCENTAGE') {
          total = total - total * (pValue / 100)
        } else if (pType === 'FIXED') {
          total = Math.max(0, total - pValue)
        }
      }
      form.amount = Math.round(total)
      if (form.amount > 0) {
        amountDisplay.value = form.amount.toLocaleString('id-ID')
      }
    }
  }
)

// ── Reset & Initialize on Open ─────────────────────────────────
const resetForm = () => {
  errorMessage.value = ''
  form.description = ''
  form.amount = 0
  amountDisplay.value = ''
  form.unitPrice = 0
  unitPriceDisplay.value = ''
  form.quantity = 1
  form.date = new Date().toISOString().split('T')[0]
  form.isPromo = false
  form.promoType = 'PERCENTAGE'
  form.promoValue = 0
  promoValueDisplay.value = ''
  form.promoDetails = ''
  form.tags = []
  form.notes = ''
  form.receiptImage = ''
  tagInput.value = ''

  // Select first category and first wallet if available
  if (filteredCategories.value.length > 0 && filteredCategories.value[0]) {
    form.categoryId = filteredCategories.value[0].id
  }
  if (wallets.value.length > 0 && wallets.value[0]) {
    form.walletId = wallets.value[0].id
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      refreshWallets()
      refreshCategories()
      resetForm()

      // Apply initial data (e.g. from AI Scanner)
      if (props.initialData) {
        if (props.initialData.merchant) form.description = props.initialData.merchant
        if (props.initialData.totalAmount) {
          form.amount = props.initialData.totalAmount
          form.unitPrice = props.initialData.totalAmount
          amountDisplay.value = props.initialData.totalAmount.toLocaleString('id-ID')
          unitPriceDisplay.value = props.initialData.totalAmount.toLocaleString('id-ID')
        }
        if (props.initialData.date) form.date = props.initialData.date
        if (props.initialData.matchedCategoryId) {
          form.categoryId = props.initialData.matchedCategoryId
        }
        if (props.initialData.items && props.initialData.items.length > 0) {
          const itemLines = props.initialData.items
            .map((it) => `• ${it.quantity}x ${it.name} (${formatIDR(it.unitPrice)})`)
            .join('\n')
          form.notes = itemLines
        } else if (props.initialData.notes) {
          form.notes = props.initialData.notes
        }
      }
    }
  },
  { immediate: true }
)

// ── Tags & Photo Handlers ─────────────────────────────────────
const addTag = () => {
  const t = tagInput.value.trim().replace(/^#/, '')
  if (t && !form.tags.includes(t)) {
    form.tags.push(t)
    triggerHaptic('light')
  }
  tagInput.value = ''
}

const removeTag = (idx: number) => {
  form.tags.splice(idx, 1)
  triggerHaptic('light')
}

const handleReceiptUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = 'Ukuran foto maksimal 10 MB'
    return
  }
  try {
    const compressed = await compressImage(file, 1024, 1024, 0.75)
    form.receiptImage = compressed
    triggerHaptic('light')
  } catch (err) {
    console.error('Gagal mengompres gambar', err)
  }
}

// ── Selected entities ─────────────────────────────────────────
const selectedWallet = computed(() => {
  return wallets.value.find((w: any) => w.id === form.walletId)
})

const selectedCategory = computed(() => {
  return allCategories.value.find((c: any) => c.id === form.categoryId)
})

const isExpense = computed(() => props.type === 'EXPENSE')

// ── Submit Transaction ────────────────────────────────────────
const closeModal = () => {
  if (loading.value) return
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (form.amount <= 0) {
    errorMessage.value = 'Nominal harus lebih dari 0'
    return
  }
  if (!form.categoryId) {
    errorMessage.value = 'Pilih kategori terlebih dahulu'
    return
  }
  if (!form.walletId) {
    errorMessage.value = isExpense.value ? 'Pilih dompet sumber' : 'Pilih dompet tujuan'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''
    triggerHaptic('medium')

    const payload: any = {
      amount: form.amount,
      type: props.type,
      categoryId: form.categoryId,
      description: form.description.trim() || (isExpense.value ? 'Pengeluaran' : 'Pemasukan'),
      notes: form.notes.trim() || undefined,
      date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
      tags: form.tags,
    }

    if (isExpense.value) {
      payload.walletFromId = form.walletId
      payload.quantity = form.quantity
      payload.unitPrice = form.unitPrice || form.amount
      payload.isPromo = form.isPromo
      if (form.isPromo) {
        payload.promoType = form.promoType
        payload.promoValue = form.promoValue
        payload.promoDetails = form.promoDetails || undefined
      }
      if (form.receiptImage) {
        payload.receiptImage = form.receiptImage
      }
    } else {
      payload.walletToId = form.walletId
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
    errorMessage.value = err?.data?.message || err?.message || 'Gagal menyimpan transaksi'
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
        class="bg-white dark:bg-surface-900 w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col animate-slide-up sm:animate-scale-up overflow-hidden"
      >
        <!-- ── Header ─────────────────────────────────────────── -->
        <div
          class="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shrink-0"
          :class="isExpense ? 'bg-rose-500/5' : 'bg-emerald-500/5'"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs"
              :class="isExpense ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'"
            >
              {{ isExpense ? '💸' : '💰' }}
            </div>
            <div>
              <h3 class="text-base font-extrabold text-gray-800 dark:text-gray-100">
                {{ isExpense ? 'Catat Pengeluaran' : 'Catat Pemasukan' }}
              </h3>
              <p class="text-[11px] text-gray-400">
                {{ isExpense ? 'Belanja, makanan, tagihan, atau kebutuhan' : 'Gaji, bonus, profit, atau pemasukan lain' }}
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

          <!-- Description / Product Name -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {{ isExpense ? '📦 Nama Item / Toko' : '📝 Keterangan Pemasukan' }}
            </label>
            <input
              v-model="form.description"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
              :placeholder="isExpense ? 'misal: Kopi Susu, Indomaret, Listrik' : 'misal: Gaji Bulanan, Dividen, Freelance'"
            />
          </div>

          <!-- Amount Input (with Math Expression Calculator) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                💵 Nominal (Rp)
              </label>
              <span v-if="amountMath.isExpression" class="text-[10px] font-semibold text-primary-500">
                Kalkulator: = Rp {{ (amountMath.result || 0).toLocaleString('id-ID') }}
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
                class="w-full pl-11 pr-3.5 py-3 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-lg font-black text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="0 / contoh: 25000*3"
              />
            </div>
          </div>

          <!-- Qty & Unit Price (For Expense) -->
          <div v-if="isExpense" class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                🔢 Jumlah (Qty)
              </label>
              <input
                v-model.number="form.quantity"
                type="number"
                min="1"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                🏷️ Harga Satuan
              </label>
              <input
                :value="unitPriceDisplay"
                type="text"
                @input="onUnitPriceInput"
                @blur="onUnitPriceBlur"
                class="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
                placeholder="Harga per pcs"
              />
            </div>
          </div>

          <!-- Category Selection -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              🏷️ Kategori
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="cat in filteredCategories"
                :key="cat.id"
                type="button"
                @click="form.categoryId = cat.id; triggerHaptic('light')"
                class="p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all"
                :class="
                  form.categoryId === cat.id
                    ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/40 font-bold shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                "
              >
                <span
                  class="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0"
                  :style="{ backgroundColor: (cat.color || '#10b981') + '25', color: cat.color || '#10b981' }"
                >
                  {{ cat.icon || '🏷️' }}
                </span>
                <span class="text-xs truncate">{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <!-- Wallet Selection -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {{ isExpense ? '💳 Dompet Sumber' : '💳 Dompet Tujuan' }}
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                v-for="w in wallets"
                :key="w.id"
                type="button"
                @click="form.walletId = w.id; triggerHaptic('light')"
                class="p-3 rounded-2xl border text-left flex items-center justify-between transition-all"
                :class="
                  form.walletId === w.id
                    ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/40 shadow-xs'
                    : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-800 text-gray-700 dark:text-gray-300'
                "
              >
                <div class="flex items-center gap-2.5 truncate">
                  <span class="text-base">{{ w.icon || '💳' }}</span>
                  <div class="truncate">
                    <div class="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{{ w.name }}</div>
                    <div class="text-[10px] text-gray-400">Saldo: {{ formatIDR(w.balance) }}</div>
                  </div>
                </div>
                <div v-if="form.walletId === w.id" class="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-[10px] shrink-0">
                  ✓
                </div>
              </button>
            </div>
          </div>

          <!-- Date Input -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              📅 Tanggal
            </label>
            <input
              v-model="form.date"
              type="date"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              📝 Catatan / Rincian (Opsional)
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              class="w-full px-3.5 py-2 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
              placeholder="Catatan tambahan..."
            />
          </div>

          <!-- Tags Chips -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              🏷️ Tag / Label
            </label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <span
                v-for="(tag, idx) in form.tags"
                :key="tag"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-bold"
              >
                #{{ tag }}
                <button type="button" @click="removeTag(idx)" class="text-primary-500 hover:text-primary-700">×</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="tagInput"
                type="text"
                @keydown.enter.prevent="addTag"
                class="flex-1 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                placeholder="Ketik tag lalu tekan enter (misal: #Kuliner)"
              />
              <button
                type="button"
                @click="addTag"
                class="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-300 transition-all"
              >
                + Tambah
              </button>
            </div>
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
            class="flex-1 py-3 rounded-2xl text-white font-black text-xs shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
            :class="
              isExpense
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
            "
          >
            <span v-if="loading" class="animate-spin text-sm">⏳</span>
            <span>{{ loading ? 'Menyimpan...' : (isExpense ? 'Simpan Pengeluaran' : 'Simpan Pemasukan') }}</span>
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

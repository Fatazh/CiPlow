<script setup lang="ts">
// components/transactions/TransactionFormModal.vue — Dedicated Modal for Add Expense & Add Income
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import {
  XIcon,
  ChevronRightIcon,
  CheckIcon,
  SparklesIcon,
  CameraIcon,
  Trash2Icon,
  PercentIcon,
  TagIcon
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

const promoTypeOptions = [
  { value: 'PERCENTAGE' as const, label: 'Diskon %', icon: '🏷️' },
  { value: 'FIXED' as const, label: 'Potongan Rp', icon: '💸' },
  { value: 'BUY_X_GET_Y' as const, label: 'Buy X Get Y', icon: '🎁' },
]

const amountDisplay = ref('')
const unitPriceDisplay = ref('')
const promoValueDisplay = ref('')
const tagInput = ref('')
const loading = ref(false)
const errorMessage = ref('')
const receiptFileInput = ref<HTMLInputElement | null>(null)
const showReceiptPreview = ref(false)

// Picker sheets state
const showCategoryPicker = ref(false)
const showWalletPicker = ref(false)

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

const onPromoValueInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  const num = parseInt(raw) || 0
  form.promoValue = num
  promoValueDisplay.value = num > 0 ? num.toLocaleString('id-ID') : ''
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

const savingsAmount = computed(() => {
  if (!form.isPromo || props.type !== 'EXPENSE') return 0
  const baseTotal = form.quantity * form.unitPrice
  if (form.promoType === 'PERCENTAGE') {
    return baseTotal * (form.promoValue / 100)
  } else if (form.promoType === 'FIXED') {
    return Math.min(baseTotal, form.promoValue)
  }
  return 0
})

const scrollContainerRef = ref<HTMLElement | null>(null)

const scrollToTop = () => {
  nextTick(() => {
    scrollContainerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

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
  showCategoryPicker.value = false
  showWalletPicker.value = false

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
      if (import.meta.client && typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden'
      }
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
    } else {
      if (import.meta.client && typeof document !== 'undefined') {
        document.body.style.overflow = ''
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  if (import.meta.client && typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

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
    scrollToTop()
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

const removeReceipt = () => {
  form.receiptImage = ''
  if (receiptFileInput.value) receiptFileInput.value.value = ''
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
    scrollToTop()
    return
  }
  if (!form.categoryId) {
    errorMessage.value = 'Pilih kategori terlebih dahulu'
    scrollToTop()
    return
  }
  if (!form.walletId) {
    errorMessage.value = isExpense.value ? 'Pilih dompet sumber' : 'Pilih dompet tujuan'
    scrollToTop()
    return
  }

  // Pre-check for insufficient balance on Expense
  if (isExpense.value && selectedWallet.value && Number(selectedWallet.value.balance) < form.amount) {
    errorMessage.value = `Saldo sumber dana tidak mencukupi. Saldo '${selectedWallet.value.name}' saat ini : ${Number(selectedWallet.value.balance)}`
    scrollToTop()
    triggerHaptic('error')
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
    scrollToTop()
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
      class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      @click.self="closeModal"
    >
      <div
        class="bg-white dark:bg-surface-900 w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col animate-slide-up sm:animate-scale-up overflow-hidden relative"
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
        <div ref="scrollContainerRef" class="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
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
              {{ isExpense ? '📦 Nama Item / Toko' : '💼 Nama Pemasukan' }}
            </label>
            <input
              v-model="form.description"
              type="text"
              class="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
              :placeholder="isExpense ? 'misal: Indomie Goreng, Kopi Susu' : 'misal: Gaji Bulanan, Freelance, Dividen'"
            />
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

          <!-- Kategori Selector (Dropdown / BottomSheet trigger) -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              🏷️ Kategori
            </label>
            <button
              type="button"
              class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 flex items-center gap-3 text-left transition-all hover:border-primary-400 active:scale-98 group"
              @click="showCategoryPicker = true"
            >
              <span
                v-if="selectedCategory"
                class="flex items-center justify-center w-10 h-10 rounded-xl text-lg shrink-0"
                :style="{ backgroundColor: (selectedCategory.color || '#10b981') + '25', color: selectedCategory.color || '#10b981' }"
              >
                {{ selectedCategory.icon || '🏷️' }}
              </span>
              <span
                v-else
                class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg shrink-0"
              >🏷️</span>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Kategori</p>
                <p class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                  {{ selectedCategory?.name ?? 'Pilih kategori' }}
                </p>
              </div>
              <ChevronRightIcon class="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
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
                class="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-center text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                💰 Harga Satuan
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Rp</span>
                <input
                  :value="unitPriceDisplay"
                  type="text"
                  @input="onUnitPriceInput"
                  @blur="onUnitPriceBlur"
                  class="w-full pl-8 pr-3 py-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-right text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500 transition-all"
                  placeholder="0 / misal: 25000*3"
                />
              </div>
              <div v-if="unitPriceMath.isExpression && unitPriceMath.isValid" class="flex justify-end mt-1">
                <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs">
                  🧮 = {{ formatIDR(unitPriceMath.result || 0) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Promo Section (For Expense) -->
          <div v-if="isExpense" class="p-4 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 cursor-pointer" @click="form.isPromo = !form.isPromo">
                <span class="text-base">🏷️</span>
                <span class="text-xs font-bold text-gray-800 dark:text-gray-100">Gunakan Promo</span>
              </div>
              <input
                id="modalIsPromo"
                v-model="form.isPromo"
                type="checkbox"
                class="w-4 h-4 rounded text-rose-500 cursor-pointer accent-rose-500"
              />
            </div>
            <div v-if="form.isPromo" class="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700 animate-slide-up">
              <div class="flex gap-1 p-1 rounded-xl bg-gray-200/60 dark:bg-surface-900">
                <button
                  v-for="opt in promoTypeOptions"
                  :key="opt.value"
                  type="button"
                  class="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                  :class="
                    form.promoType === opt.value
                      ? 'bg-white dark:bg-surface-800 shadow-sm text-rose-500'
                      : 'text-gray-400'
                  "
                  @click="form.promoType = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>

              <!-- Diskon % -->
              <div v-if="form.promoType === 'PERCENTAGE'" class="relative flex items-center">
                <input
                  v-model.number="form.promoValue"
                  type="number"
                  class="w-full px-3 py-2 rounded-xl bg-white dark:bg-surface-900 border border-gray-200 dark:border-gray-700 text-center font-bold text-sm text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
                <span class="absolute right-3 font-bold text-gray-400 text-xs">%</span>
              </div>

              <!-- Potongan Rp -->
              <div v-if="form.promoType === 'FIXED'" class="relative flex items-center">
                <span class="absolute left-3 font-bold text-gray-400 text-xs">Rp</span>
                <input
                  :value="promoValueDisplay"
                  type="text"
                  inputmode="numeric"
                  class="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-surface-900 border border-gray-200 dark:border-gray-700 text-center font-bold text-sm text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                  @input="onPromoValueInput"
                />
              </div>

              <!-- Buy X Get Y -->
              <input
                v-if="form.promoType === 'BUY_X_GET_Y'"
                v-model="form.promoDetails"
                type="text"
                class="w-full px-3 py-2 rounded-xl bg-white dark:bg-surface-900 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                placeholder="contoh: Beli 1 Gratis 1"
              />

              <!-- Savings Alert -->
              <p
                v-if="savingsAmount > 0"
                class="text-[11px] font-bold text-emerald-500 flex items-center gap-1 mt-1 animate-pulse"
              >
                ✨ Anda sudah menghemat {{ formatIDR(savingsAmount) }}!
              </p>
            </div>
          </div>

          <!-- Dompet / Sumber Dana Selector (Dropdown / BottomSheet trigger) -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {{ isExpense ? '💳 Sumber Dana' : '💳 Tujuan Dana' }}
            </label>
            <button
              type="button"
              class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 flex items-center gap-3 text-left transition-all hover:border-primary-400 active:scale-98 group"
              @click="showWalletPicker = true"
            >
              <span
                v-if="selectedWallet"
                class="flex items-center justify-center w-10 h-10 rounded-xl text-lg shrink-0"
                :style="{ backgroundColor: (selectedWallet.color || '#3b82f6') + '25' }"
              >
                {{ selectedWallet.icon || '💳' }}
              </span>
              <span
                v-else
                class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 text-lg shrink-0"
              >👛</span>
              <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {{ isExpense ? 'Sumber Dana' : 'Tujuan Dana' }}
                </p>
                <p class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                  {{ selectedWallet?.name ?? 'Pilih dompet' }}
                </p>
                <p v-if="selectedWallet" class="text-[11px] text-gray-400">
                  Saldo: {{ formatIDR(selectedWallet.balance) }}
                </p>
              </div>
              <ChevronRightIcon class="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <!-- Amount Input (Big display for Income or total confirmation) -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                💵 Total Nominal (Rp)
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
                placeholder="0 / contoh: 50000+15000"
              />
            </div>
            <p v-if="isExpense && form.quantity > 1" class="text-[10px] text-gray-400">
              {{ form.quantity }} x {{ formatIDR(form.unitPrice) }}
            </p>
          </div>

          <!-- Notes -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              📝 Catatan / Keterangan (Opsional)
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
            <div v-if="form.tags.length > 0" class="flex flex-wrap gap-1.5 mb-2">
              <span
                v-for="(tag, idx) in form.tags"
                :key="tag"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 text-xs font-bold"
              >
                #{{ tag }}
                <button type="button" @click="removeTag(idx)" class="text-primary-500 hover:text-primary-700 font-black">×</button>
              </span>
            </div>
            <div class="flex gap-2">
              <input
                v-model="tagInput"
                type="text"
                @keydown.enter.prevent="addTag"
                class="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                placeholder="Ketik tag lalu tekan enter (misal: #Kuliner)"
              />
              <button
                type="button"
                @click="addTag"
                class="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-300 transition-all"
              >
                + Tag
              </button>
            </div>
          </div>

          <!-- Receipt Upload (For Expense) -->
          <div v-if="isExpense" class="space-y-1.5">
            <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              📸 Foto Struk / Bukti Bayar (Opsional)
            </label>
            <input
              ref="receiptFileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleReceiptUpload"
            />
            <div v-if="!form.receiptImage">
              <button
                type="button"
                class="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50/20 text-gray-500 dark:text-gray-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                @click="receiptFileInput?.click()"
              >
                <CameraIcon class="w-4 h-4 text-primary-500" />
                <span>Unggah Foto Struk / Bukti Bayar</span>
              </button>
            </div>
            <div v-else class="flex items-center justify-between p-2.5 rounded-2xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <img
                  :src="form.receiptImage"
                  alt="Struk"
                  class="w-12 h-12 object-cover rounded-xl shadow-xs cursor-pointer hover:opacity-90"
                  @click="showReceiptPreview = true"
                />
                <div>
                  <p class="text-xs font-bold text-gray-800 dark:text-white">Foto Struk Terlampir</p>
                  <button
                    type="button"
                    class="text-[11px] font-semibold text-primary-500 hover:underline"
                    @click="showReceiptPreview = true"
                  >
                    Lihat Ukuran Penuh
                  </button>
                </div>
              </div>
              <button
                type="button"
                class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-bold transition-colors"
                @click="removeReceipt"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>

        <!-- ── Footer Actions (Pinned at Bottom) ───────────────── -->
        <div class="p-4 bg-gray-50/95 dark:bg-surface-800/95 border-t border-gray-100 dark:border-gray-800 flex gap-2.5 shrink-0 z-10 shadow-lg">
          <button
            type="button"
            @click="closeModal"
            class="px-5 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-200 font-bold text-xs transition-all active:scale-95"
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
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-500/25'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/25'
            "
          >
            <span v-if="loading" class="animate-spin text-sm">⏳</span>
            <span>{{ loading ? 'Menyimpan...' : (isExpense ? 'Simpan Pengeluaran' : 'Simpan Pemasukan') }}</span>
          </button>
        </div>

        <!-- ══════════════════════════════════════════════════════
             INNER PICKER OVERLAYS (Category & Wallet)
        ══════════════════════════════════════════════════════ -->
        <!-- Category Picker Overlay -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-full"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-full"
        >
          <div
            v-if="showCategoryPicker"
            class="absolute inset-0 z-20 bg-white dark:bg-surface-900 flex flex-col"
          >
            <div class="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div>
                <h4 class="text-base font-extrabold text-gray-800 dark:text-gray-100">Pilih Kategori</h4>
                <p class="text-xs text-gray-400">{{ isExpense ? 'Kategori pengeluaran' : 'Kategori pemasukan' }}</p>
              </div>
              <button
                type="button"
                @click="showCategoryPicker = false"
                class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>
            <div class="p-4 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              <button
                v-for="cat in filteredCategories"
                :key="cat.id"
                type="button"
                @click="form.categoryId = cat.id; showCategoryPicker = false; triggerHaptic('light')"
                class="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left"
                :class="
                  form.categoryId === cat.id
                    ? 'bg-primary-50 dark:bg-primary-950/40 ring-2 ring-primary-500 font-bold'
                    : 'bg-gray-50/60 dark:bg-surface-800 hover:bg-gray-100 dark:hover:bg-surface-700'
                "
              >
                <span
                  class="flex items-center justify-center w-10 h-10 rounded-xl text-lg shrink-0"
                  :style="{ backgroundColor: (cat.color || '#10b981') + '25', color: cat.color || '#10b981' }"
                >
                  {{ cat.icon || '🏷️' }}
                </span>
                <span class="text-sm font-semibold text-gray-800 dark:text-gray-100 flex-1 truncate">
                  {{ cat.name }}
                </span>
                <span v-if="form.categoryId === cat.id" class="text-primary-500 font-black">✓</span>
              </button>

              <div v-if="filteredCategories.length === 0" class="py-8 text-center text-gray-400 text-xs">
                Belum ada kategori {{ isExpense ? 'pengeluaran' : 'pemasukan' }}.
              </div>
            </div>
          </div>
        </Transition>

        <!-- Wallet Picker Overlay -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-full"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-full"
        >
          <div
            v-if="showWalletPicker"
            class="absolute inset-0 z-20 bg-white dark:bg-surface-900 flex flex-col"
          >
            <div class="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div>
                <h4 class="text-base font-extrabold text-gray-800 dark:text-gray-100">
                  {{ isExpense ? 'Pilih Dompet Sumber' : 'Pilih Dompet Tujuan' }}
                </h4>
                <p class="text-xs text-gray-400">
                  {{ isExpense ? 'Uang keluar dari dompet ini' : 'Uang masuk ke dompet ini' }}
                </p>
              </div>
              <button
                type="button"
                @click="showWalletPicker = false"
                class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <XIcon class="w-4 h-4" />
              </button>
            </div>
            <div class="p-4 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              <button
                v-for="w in wallets"
                :key="w.id"
                type="button"
                @click="form.walletId = w.id; showWalletPicker = false; triggerHaptic('light')"
                class="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all text-left"
                :class="
                  form.walletId === w.id
                    ? 'bg-primary-50 dark:bg-primary-950/40 ring-2 ring-primary-500 font-bold'
                    : 'bg-gray-50/60 dark:bg-surface-800 hover:bg-gray-100 dark:hover:bg-surface-700'
                "
              >
                <span
                  class="flex items-center justify-center w-10 h-10 rounded-xl text-lg shrink-0"
                  :style="{ backgroundColor: (w.color || '#3b82f6') + '25' }"
                >
                  {{ w.icon || '💳' }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                    {{ w.name }}
                  </p>
                  <p class="text-xs text-gray-400">
                    Saldo: {{ formatIDR(w.balance) }}
                  </p>
                </div>
                <span v-if="form.walletId === w.id" class="text-primary-500 font-black">✓</span>
              </button>
            </div>
          </div>
        </Transition>

        <!-- Fullscreen Receipt Image Preview Overlay -->
        <div
          v-if="showReceiptPreview && form.receiptImage"
          class="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          @click.self="showReceiptPreview = false"
        >
          <button
            type="button"
            @click="showReceiptPreview = false"
            class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-xl font-bold"
          >
            ✕
          </button>
          <img
            :src="form.receiptImage"
            alt="Struk Preview"
            class="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
          />
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

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  UsersIcon,
  PlusIcon,
  Trash2Icon,
  CopyIcon,
  CheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  XIcon,
  PercentIcon,
  ReceiptIcon
} from 'lucide-vue-next'

interface Participant {
  id: string
  name: string
  customAmount: number
  isSelf: boolean
  isSavedAsDebt?: boolean
}

const props = defineProps<{
  modelValue: boolean
  initialAmount?: number
  billTitle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'debtCreated': []
}>()

const { formatIDR } = useCurrency()

// ── State ────────────────────────────────────────────────────────
const billTitle = ref(props.billTitle || 'Makan Bersama')
const rawBillAmount = ref<number>(props.initialAmount || 0)
const billAmountDisplay = ref(props.initialAmount ? props.initialAmount.toLocaleString('id-ID') : '')

const taxPercent = ref<number>(0)
const servicePercent = ref<number>(0)
const splitMode = ref<'EQUAL' | 'CUSTOM'>('EQUAL')

const newFriendName = ref('')
const participants = ref<Participant[]>([
  { id: '1', name: 'Saya (Pribadi)', customAmount: 0, isSelf: true },
  { id: '2', name: 'Teman 1', customAmount: 0, isSelf: false },
])

const copiedToast = ref(false)
const savingDebtFor = ref<string | null>(null)
const debtSuccessToast = ref('')

watch(() => props.initialAmount, (val) => {
  if (val && val > 0) {
    rawBillAmount.value = val
    billAmountDisplay.value = val.toLocaleString('id-ID')
  }
})

// ── Calculation ──────────────────────────────────────────────────
const totalCustomSum = computed(() => {
  return participants.value.reduce((sum, p) => sum + (Number(p.customAmount) || 0), 0)
})

const subtotal = computed(() => {
  const manual = Number(rawBillAmount.value) || 0
  if (splitMode.value === 'CUSTOM' && manual === 0) {
    return totalCustomSum.value
  }
  return manual
})

const taxAmount = computed(() => Math.round(subtotal.value * (Number(taxPercent.value) || 0) / 100))
const serviceAmount = computed(() => Math.round(subtotal.value * (Number(servicePercent.value) || 0) / 100))
const grandTotal = computed(() => subtotal.value + taxAmount.value + serviceAmount.value)

// Total multiplier for extra tax & service
const extraRatio = computed(() => {
  if (subtotal.value <= 0) return 1
  return grandTotal.value / subtotal.value
})

const splitCalculations = computed(() => {
  const count = participants.value.length
  if (count === 0) return []

  if (splitMode.value === 'EQUAL') {
    const perPerson = Math.round(grandTotal.value / count)
    return participants.value.map(p => ({
      ...p,
      calculatedAmount: perPerson
    }))
  } else {
    // Custom split with proportional tax & service
    return participants.value.map(p => {
      const base = Number(p.customAmount) || 0
      const calculated = Math.round(base * extraRatio.value)
      return {
        ...p,
        calculatedAmount: calculated
      }
    })
  }
})

const onBillAmountInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  const num = parseInt(val) || 0
  rawBillAmount.value = num
  billAmountDisplay.value = num > 0 ? num.toLocaleString('id-ID') : ''
}

const addParticipant = () => {
  const name = newFriendName.value.trim() || `Teman ${participants.value.length}`
  participants.value.push({
    id: Date.now().toString(),
    name,
    customAmount: 0,
    isSelf: false
  })
  newFriendName.value = ''
  triggerHaptic('light')
}

const removeParticipant = (id: string) => {
  participants.value = participants.value.filter(p => p.id !== id || p.isSelf)
  triggerHaptic('light')
}

const onCustomAmountInput = (id: string, e: Event) => {
  const target = participants.value.find(item => item.id === id)
  if (!target) return
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  const num = parseInt(val) || 0
  target.customAmount = num
}

// ── Quick Save as Debt (Piutang) ─────────────────────────────────
const recordAsDebt = async (p: { id: string; name: string; calculatedAmount: number }) => {
  if (p.calculatedAmount <= 0) return
  savingDebtFor.value = p.id
  triggerHaptic('medium')

  try {
    await $fetch('/api/debts', {
      method: 'POST',
      body: {
        type: 'LEND', // Piutang (kita talangi)
        personName: p.name,
        totalAmount: p.calculatedAmount,
        notes: `Talangan bagi tagihan: ${billTitle.value} (${formatIDR(p.calculatedAmount)})`,
      }
    })

    const target = participants.value.find(item => item.id === p.id)
    if (target) target.isSavedAsDebt = true

    debtSuccessToast.value = `✓ Bagian ${p.name} dicatat sebagai Piutang!`
    triggerHaptic('success')
    emit('debtCreated')

    setTimeout(() => {
      debtSuccessToast.value = ''
    }, 3000)
  } catch (err: any) {
    debtSuccessToast.value = `⚠️ ${err?.data?.message || 'Gagal menyimpan piutang'}`
    triggerHaptic('error')
    setTimeout(() => {
      debtSuccessToast.value = ''
    }, 3000)
  } finally {
    savingDebtFor.value = null
  }
}

// ── Copy Summary for WhatsApp ────────────────────────────────────
const copySummary = () => {
  let text = `🧾 *Rincian Bagi Tagihan: ${billTitle.value}*\n`
  text += `💰 Subtotal: ${formatIDR(subtotal.value)}\n`
  if (taxAmount.value > 0) text += `📌 Pajak (${taxPercent.value}%): ${formatIDR(taxAmount.value)}\n`
  if (serviceAmount.value > 0) text += `🛎️ Service (${servicePercent.value}%): ${formatIDR(serviceAmount.value)}\n`
  text += `💵 *Total Tagihan: ${formatIDR(grandTotal.value)}*\n`
  text += `👥 Jumlah Orang: ${participants.value.length} orang\n\n`
  text += `*Rincian Pembagian:*\n`

  for (const p of splitCalculations.value) {
    text += `• ${p.name}: *${formatIDR(p.calculatedAmount)}*\n`
  }

  text += `\n_Dihitung dengan CashPlow Budget Tracker_`

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
    copiedToast.value = true
    triggerHaptic('success')
    setTimeout(() => {
      copiedToast.value = false
    }, 3000)
  }
}
</script>

<template>
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
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-xs px-4 pb-6 touch-none overscroll-contain"
        @click.self="emit('update:modelValue', false)"
      >
        <Transition
          enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
          enter-from-class="opacity-0 translate-y-8 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-4 scale-95"
        >
          <div
            class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[88vh] overflow-y-auto space-y-4"
          >
            <!-- Header -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 flex items-center justify-center text-xl">
                  🧮
                </div>
                <div>
                  <h3 class="text-base font-black text-gray-800 dark:text-gray-100">
                    Kalkulator Bagi Tagihan
                  </h3>
                  <p class="text-[11px] text-gray-400">
                    Split bill makan bersama & talangan teman
                  </p>
                </div>
              </div>

              <button
                class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                @click="emit('update:modelValue', false)"
              >
                <XIcon :size="18" />
              </button>
            </div>

            <!-- Bill Title & Total Input -->
            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-surface-800/60 border border-gray-100 dark:border-gray-800 space-y-3">
              <div>
                <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Nama Acara / Tagihan
                </label>
                <input
                  v-model="billTitle"
                  type="text"
                  placeholder="Misal: Makan Siang Bersama, Belanja Villa"
                  class="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-900 text-xs font-semibold focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label class="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Nominal Tagihan (Subtotal)
                </label>
                <div class="relative">
                  <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputmode="numeric"
                    :value="billAmountDisplay"
                    placeholder="0"
                    @input="onBillAmountInput"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-900 text-sm font-black text-gray-800 dark:text-gray-100 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <!-- Tax & Service Inputs -->
              <div class="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Pajak PPN (%)
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="taxPercent"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      class="w-full pl-3 pr-7 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-900 text-xs font-bold focus:outline-none focus:border-primary-500"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">%</span>
                  </div>
                </div>

                <div>
                  <label class="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                    Service Charge (%)
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="servicePercent"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      class="w-full pl-3 pr-7 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-900 text-xs font-bold focus:outline-none focus:border-primary-500"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grand Total Display Strip -->
            <div class="p-3.5 rounded-2xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-200 dark:border-primary-900/40 flex items-center justify-between">
              <div>
                <span class="text-[10px] font-bold text-gray-400 uppercase">Total Setelah Pajak</span>
                <div class="text-base font-black text-primary-600 dark:text-primary-400">
                  {{ formatIDR(grandTotal) }}
                </div>
              </div>

              <!-- Mode Switcher -->
              <div class="flex rounded-xl bg-gray-200/60 dark:bg-slate-800 p-0.5 text-[11px] font-bold">
                <button
                  class="px-2.5 py-1 rounded-lg transition-all"
                  :class="splitMode === 'EQUAL' ? 'bg-white dark:bg-surface-900 shadow-xs text-primary-600 dark:text-primary-400' : 'text-gray-500'"
                  @click="splitMode = 'EQUAL'; triggerHaptic('light')"
                >
                  Bagi Rata
                </button>
                <button
                  class="px-2.5 py-1 rounded-lg transition-all"
                  :class="splitMode === 'CUSTOM' ? 'bg-white dark:bg-surface-900 shadow-xs text-primary-600 dark:text-primary-400' : 'text-gray-500'"
                  @click="splitMode = 'CUSTOM'; triggerHaptic('light')"
                >
                  Kustom
                </button>
              </div>
            </div>

            <!-- Participants List -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-gray-400 px-1">
                <span>Daftar Orang ({{ participants.length }})</span>
                <span v-if="splitMode === 'EQUAL'">Masing-masing: {{ formatIDR(splitCalculations[0]?.calculatedAmount || 0) }}</span>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(p, idx) in splitCalculations"
                  :key="p.id"
                  class="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2"
                  :class="p.isSelf ? 'bg-primary-50/20 dark:bg-primary-950/10' : 'bg-white dark:bg-surface-900'"
                >
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs">{{ p.isSelf ? '👑' : '👤' }}</span>
                      <span class="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">
                        {{ p.name }}
                      </span>
                    </div>

                    <!-- Custom input mode -->
                    <div v-if="splitMode === 'CUSTOM'" class="mt-1.5 flex items-center gap-1">
                      <span class="text-[10px] text-gray-400">Harga Item:</span>
                      <input
                        type="text"
                        inputmode="numeric"
                        :value="p.customAmount ? p.customAmount.toLocaleString('id-ID') : ''"
                        placeholder="0"
                        @input="onCustomAmountInput(p.id, $event)"
                        class="w-24 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-800 text-xs font-bold focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <!-- Amount & Actions -->
                  <div class="flex items-center gap-2">
                    <div class="text-right">
                      <span class="text-xs font-black text-gray-800 dark:text-gray-100 block">
                        {{ formatIDR(p.calculatedAmount) }}
                      </span>
                    </div>

                    <!-- Record as Debt Button (for non-self) -->
                    <button
                      v-if="!p.isSelf"
                      :disabled="p.isSavedAsDebt || savingDebtFor === p.id || p.calculatedAmount <= 0"
                      class="px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                      :class="[
                        p.isSavedAsDebt
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-primary-500 hover:bg-primary-600 text-white shadow-xs active:scale-95'
                      ]"
                      @click="recordAsDebt(p)"
                    >
                      <span v-if="p.isSavedAsDebt">✓ Piutang</span>
                      <span v-else-if="savingDebtFor === p.id">⏳</span>
                      <span v-else>+ Catat Piutang</span>
                    </button>

                    <!-- Delete friend -->
                    <button
                      v-if="!p.isSelf"
                      class="text-gray-300 hover:text-rose-500 p-1 transition-colors"
                      @click="removeParticipant(p.id)"
                    >
                      <Trash2Icon :size="14" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Add Person Input -->
              <div class="flex items-center gap-2 pt-1">
                <input
                  v-model="newFriendName"
                  type="text"
                  placeholder="Tambah nama teman..."
                  @keyup.enter="addParticipant"
                  class="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-surface-800 text-xs font-semibold focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  class="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1 transition-all"
                  @click="addParticipant"
                >
                  <PlusIcon :size="14" />
                  Tambah
                </button>
              </div>
            </div>

            <!-- Toast Feedback -->
            <div
              v-if="debtSuccessToast"
              class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center animate-fade-in"
            >
              {{ debtSuccessToast }}
            </div>

            <div
              v-if="copiedToast"
              class="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs font-bold text-primary-600 dark:text-primary-400 text-center animate-fade-in"
            >
              ✓ Rincian tagihan disalin ke Clipboard! Siap dibagikan ke WhatsApp.
            </div>

            <!-- Bottom Actions -->
            <div class="pt-2 flex gap-2">
              <button
                type="button"
                class="flex-1 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-98"
                @click="copySummary"
              >
                <CopyIcon :size="15" />
                <span>Salin Rincian WA</span>
              </button>

              <button
                type="button"
                class="py-3 px-5 rounded-2xl bg-primary-500 hover:bg-primary-600 text-xs font-bold text-white transition-all shadow-md shadow-primary-500/20 active:scale-98"
                @click="emit('update:modelValue', false)"
              >
                Selesai
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

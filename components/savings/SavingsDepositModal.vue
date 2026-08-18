<script setup lang="ts">
// components/savings/SavingsDepositModal.vue — Quick deposit/withdraw modal for savings goal
import { evaluateMathExpression } from '~/composables/useMathEvaluator'

const props = defineProps<{
  show: boolean
  goal: any | null
  wallets: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success', message: string): void
}>()

const { formatIDR } = useCurrency()

const action = ref<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT')
const amount = ref(0)
const amountDisplay = ref('')
const selectedWalletId = ref('')
const loading = ref(false)
const errorMessage = ref('')

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    action.value = 'DEPOSIT'
    amount.value = 0
    amountDisplay.value = ''
    selectedWalletId.value = props.wallets.length > 0 ? props.wallets[0].id : ''
    errorMessage.value = ''
  }
})

const onAmountInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  const sanitized = val.replace(/[^0-9+\-*/().\s]/g, '')
  amountDisplay.value = sanitized
  const math = evaluateMathExpression(sanitized)
  if (math.isValid && math.result !== null) {
    amount.value = math.result
  }
}

const onAmountBlur = () => {
  const math = evaluateMathExpression(amountDisplay.value)
  if (math.isValid && math.result !== null && math.result > 0) {
    amount.value = math.result
    amountDisplay.value = math.result.toLocaleString('id-ID')
  }
}

const handleSubmit = async () => {
  if (amount.value <= 0) {
    errorMessage.value = 'Nominal harus lebih dari 0'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''

    const res: any = await $fetch(`/api/savings-goals/${props.goal.id}/deposit`, {
      method: 'POST',
      body: {
        amount: amount.value,
        action: action.value,
        walletId: selectedWalletId.value || undefined,
      },
    })

    emit('success', res.message || 'Berhasil memproses tabungan!')
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Gagal memproses setoran tabungan'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show && goal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-surface-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 animate-scale-up">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl" :style="{ backgroundColor: (goal.color || '#10b981') + '20' }">
              {{ goal.icon || '🎯' }}
            </div>
            <div>
              <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">
                {{ goal.name }}
              </h3>
              <p class="text-xs text-gray-400">
                Terkumpul: {{ formatIDR(goal.currentAmount) }} / {{ formatIDR(goal.targetAmount) }}
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Action Selector -->
        <div class="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800">
          <button
            type="button"
            @click="action = 'DEPOSIT'"
            class="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            :class="action === 'DEPOSIT' ? 'bg-white dark:bg-surface-900 shadow-sm text-emerald-500' : 'text-gray-400'"
          >
            💰 Setor Tabungan (+)
          </button>
          <button
            type="button"
            @click="action = 'WITHDRAW'"
            class="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            :class="action === 'WITHDRAW' ? 'bg-white dark:bg-surface-900 shadow-sm text-rose-500' : 'text-gray-400'"
          >
            💸 Tarik Saldo (-)
          </button>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold">
          {{ errorMessage }}
        </div>

        <!-- Form fields -->
        <div class="space-y-4">
          <!-- Nominal Input -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              {{ action === 'DEPOSIT' ? 'Nominal Setoran' : 'Nominal Penarikan' }}
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 font-bold text-gray-400 text-sm">Rp</span>
              <input
                :value="amountDisplay"
                type="text"
                class="input pl-11 font-bold"
                placeholder="0 / misal: 100000+50000"
                @input="onAmountInput"
                @blur="onAmountBlur"
              />
            </div>
          </div>

          <!-- Sumber / Tujuan Dompet -->
          <div v-if="wallets.length > 0">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              {{ action === 'DEPOSIT' ? 'Ambil Saldo Dari Dompet' : 'Kembalikan Saldo Ke Dompet' }}
            </label>
            <select v-model="selectedWalletId" class="input">
              <option value="">-- Tanpa Hubungkan Dompet --</option>
              <option v-for="w in wallets" :key="w.id" :value="w.id">
                {{ w.name }} (Saldo: {{ formatIDR(w.balance) }})
              </option>
            </select>
          </div>
        </div>

        <!-- Submit Buttons -->
        <div class="flex gap-2.5 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold text-xs hover:bg-gray-200 transition-all"
          >
            Batal
          </button>
          <button
            type="button"
            :disabled="loading"
            @click="handleSubmit"
            class="flex-1 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            :class="action === 'DEPOSIT' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'"
          >
            {{ loading ? 'Memproses...' : (action === 'DEPOSIT' ? 'Konfirmasi Setor' : 'Konfirmasi Tarik') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// components/debts/DebtsPayModal.vue — Record installment or full payment for a debt/loan
import { evaluateMathExpression } from '~/composables/useMathEvaluator'

const props = defineProps<{
  show: boolean
  debt: any | null
  wallets: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success', msg: string): void
}>()

const { formatIDR } = useCurrency()

const form = reactive({
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  walletId: '',
  notes: '',
})

const amountDisplay = ref('')
const loading = ref(false)
const errorMessage = ref('')

watch(() => props.show, (isOpen) => {
  if (isOpen && props.debt) {
    errorMessage.value = ''
    form.amount = props.debt.remainingAmount || 0
    form.date = new Date().toISOString().split('T')[0]
    form.walletId = props.wallets.length > 0 ? props.wallets[0].id : ''
    form.notes = ''
    amountDisplay.value = props.debt.remainingAmount ? props.debt.remainingAmount.toLocaleString('id-ID') : ''
  }
})

const setQuickAmount = (val: number) => {
  form.amount = val
  amountDisplay.value = val > 0 ? val.toLocaleString('id-ID') : ''
}

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
  }
}

const handleSubmit = async () => {
  if (form.amount <= 0) {
    errorMessage.value = 'Nominal pembayaran harus lebih dari 0'
    return
  }

  if (props.debt && form.amount > props.debt.remainingAmount) {
    errorMessage.value = `Nominal melebihi sisa tagihan (${formatIDR(props.debt.remainingAmount)})`
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''

    const res: any = await $fetch(`/api/debts/${props.debt.id}/pay`, {
      method: 'POST',
      body: {
        amount: form.amount,
        date: form.date,
        walletId: form.walletId || undefined,
        notes: form.notes || undefined,
      },
    })

    emit('success', res.message || 'Pembayaran berhasil dicatat!')
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Gagal memproses pembayaran'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show && debt"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-surface-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 animate-scale-up">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">{{ debt.type === 'LEND' ? '🤝' : '💳' }}</span>
            <div>
              <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">
                {{ debt.type === 'LEND' ? 'Terima Pembayaran Piutang' : 'Bayar Cicilan Hutang' }}
              </h3>
              <p class="text-xs text-gray-400">
                {{ debt.personName }} (Sisa: {{ formatIDR(debt.remainingAmount) }})
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

        <!-- Error -->
        <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- Form fields -->
        <div class="space-y-4">
          <!-- Nominal Input -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Nominal yang Dibayarkan (Rp)
              </label>
              <button
                type="button"
                @click="setQuickAmount(debt.remainingAmount)"
                class="text-[11px] font-bold text-primary-500 hover:underline"
              >
                Bayar Lunas ({{ formatIDR(debt.remainingAmount) }})
              </button>
            </div>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 font-bold text-gray-400 text-sm">Rp</span>
              <input
                :value="amountDisplay"
                type="text"
                class="input pl-11 font-bold"
                placeholder="0"
                @input="onAmountInput"
                @blur="onAmountBlur"
              />
            </div>
          </div>

          <!-- Tanggal Bayar -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              Tanggal Pembayaran
            </label>
            <input v-model="form.date" type="date" class="input" />
          </div>

          <!-- Dompet Mutasi -->
          <div v-if="wallets.length > 0">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              {{ debt.type === 'LEND' ? 'Simpan Uang Masuk Ke Dompet' : 'Ambil Uang Bayar Dari Dompet' }}
            </label>
            <select v-model="form.walletId" class="input">
              <option value="">-- Jangan Ubah Saldo Dompet --</option>
              <option v-for="w in wallets" :key="w.id" :value="w.id">
                {{ w.name }} (Saldo: {{ formatIDR(w.balance) }})
              </option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              Keterangan (Opsional)
            </label>
            <input
              v-model="form.notes"
              type="text"
              class="input"
              placeholder="misal: Cicilan ke-1 via transfer BCA"
            />
          </div>
        </div>

        <!-- Buttons -->
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
            :class="debt.type === 'LEND' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'"
          >
            {{ loading ? 'Memproses...' : 'Konfirmasi Bayar 💵' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

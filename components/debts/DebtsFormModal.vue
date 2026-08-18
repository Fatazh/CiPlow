<script setup lang="ts">
// components/debts/DebtsFormModal.vue — Modal to add or edit debt/loan record
import { evaluateMathExpression } from '~/composables/useMathEvaluator'

const props = defineProps<{
  show: boolean
  debt?: any | null
  wallets: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const { formatIDR } = useCurrency()

const form = reactive({
  type: 'LEND' as 'LEND' | 'BORROW',
  personName: '',
  totalAmount: 0,
  initialPaid: 0,
  dueDate: '',
  notes: '',
  walletId: '',
})

const totalDisplay = ref('')
const loading = ref(false)
const errorMessage = ref('')

const isEditMode = computed(() => !!props.debt?.id)

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    if (props.debt?.id) {
      form.type = props.debt.type
      form.personName = props.debt.personName
      form.totalAmount = props.debt.totalAmount
      form.initialPaid = 0
      form.dueDate = props.debt.dueDate || ''
      form.notes = props.debt.notes || ''
      form.walletId = ''
      totalDisplay.value = props.debt.totalAmount ? props.debt.totalAmount.toLocaleString('id-ID') : ''
    } else {
      form.type = props.debt?.type || 'LEND'
      form.personName = ''
      form.totalAmount = 0
      form.initialPaid = 0
      form.dueDate = ''
      form.notes = ''
      form.walletId = props.wallets.length > 0 ? props.wallets[0].id : ''
      totalDisplay.value = ''
    }
  }
})

const onTotalInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  const sanitized = val.replace(/[^0-9+\-*/().\s]/g, '')
  totalDisplay.value = sanitized
  const math = evaluateMathExpression(sanitized)
  if (math.isValid && math.result !== null) {
    form.totalAmount = math.result
  }
}

const onTotalBlur = () => {
  const math = evaluateMathExpression(totalDisplay.value)
  if (math.isValid && math.result !== null && math.result > 0) {
    form.totalAmount = math.result
    totalDisplay.value = math.result.toLocaleString('id-ID')
  }
}

const handleSubmit = async () => {
  if (!form.personName.trim()) {
    errorMessage.value = 'Nama orang / pihak wajib diisi'
    return
  }
  if (form.totalAmount <= 0) {
    errorMessage.value = 'Nominal harus lebih dari 0'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''

    if (isEditMode.value) {
      await $fetch(`/api/debts/${props.debt.id}`, {
        method: 'PUT',
        body: {
          personName: form.personName,
          totalAmount: form.totalAmount,
          dueDate: form.dueDate || null,
          notes: form.notes || null,
        },
      })
    } else {
      await $fetch('/api/debts', {
        method: 'POST',
        body: {
          type: form.type,
          personName: form.personName,
          totalAmount: form.totalAmount,
          dueDate: form.dueDate || null,
          notes: form.notes || null,
          walletId: form.walletId || undefined,
        },
      })
    }

    emit('saved')
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Gagal menyimpan catatan hutang/piutang'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-surface-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">{{ form.type === 'LEND' ? '🤝' : '💳' }}</span>
            <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">
              {{ isEditMode ? 'Ubah Catatan' : (form.type === 'LEND' ? 'Catat Piutang Baru' : 'Catat Hutang Baru') }}
            </h3>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Type Selector (Only on create) -->
        <div v-if="!isEditMode" class="flex p-1 rounded-2xl bg-gray-100 dark:bg-gray-800">
          <button
            type="button"
            @click="form.type = 'LEND'"
            class="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            :class="form.type === 'LEND' ? 'bg-white dark:bg-surface-900 shadow-sm text-emerald-600' : 'text-gray-400'"
          >
            🤝 Saya Meminjamkan (Piutang)
          </button>
          <button
            type="button"
            @click="form.type = 'BORROW'"
            class="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
            :class="form.type === 'BORROW' ? 'bg-white dark:bg-surface-900 shadow-sm text-rose-500' : 'text-gray-400'"
          >
            💳 Saya Meminjam (Hutang)
          </button>
        </div>

        <!-- Error -->
        <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- Form fields -->
        <div class="space-y-4">
          <!-- Person Name -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              {{ form.type === 'LEND' ? 'Nama Peminjam (Yang Berhutang)' : 'Nama Pemberi Pinjaman' }}
            </label>
            <input
              v-model="form.personName"
              type="text"
              class="input"
              :placeholder="form.type === 'LEND' ? 'misal: Budi Santoso' : 'misal: Bank BCA, Teman Kantor'"
            />
          </div>

          <!-- Total Nominal -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              Nominal Pinjaman (Rp)
            </label>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 font-bold text-gray-400 text-sm">Rp</span>
              <input
                :value="totalDisplay"
                type="text"
                class="input pl-11 font-bold"
                placeholder="0 / misal: 500000+250000"
                @input="onTotalInput"
                @blur="onTotalBlur"
              />
            </div>
          </div>

          <!-- Due Date -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              Tanggal Jatuh Tempo (Opsional)
            </label>
            <input v-model="form.dueDate" type="date" class="input" />
          </div>

          <!-- Dompet Mutasi (Only on Create) -->
          <div v-if="!isEditMode && wallets.length > 0">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">
              {{ form.type === 'LEND' ? 'Keluarkan Uang Dari Dompet' : 'Simpan Uang Pinjaman Ke Dompet' }}
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
              Catatan / Keperluan (Opsional)
            </label>
            <textarea
              v-model="form.notes"
              class="input resize-none"
              rows="2"
              placeholder="misal: Pinjam untuk perbaikan motor..."
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
            :class="form.type === 'LEND' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'"
          >
            {{ loading ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Simpan Catatan 🚀') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// components/savings/SavingsGoalModal.vue — Modal to create or edit savings goal
import { evaluateMathExpression } from '~/composables/useMathEvaluator'

const props = defineProps<{
  show: boolean
  goal?: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const { formatIDR } = useCurrency()

const form = reactive({
  name: '',
  targetAmount: 0,
  currentAmount: 0,
  deadline: '',
  color: '#10b981',
  icon: '🎯',
})

const targetDisplay = ref('')
const currentDisplay = ref('')
const loading = ref(false)
const errorMessage = ref('')

const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#6366f1']
const icons = ['🎯', '💻', '🚗', '🏠', '✈️', '💍', '📱', '🎓', '🏥', '🏖️', '🎁', '💰']

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    errorMessage.value = ''
    if (props.goal) {
      form.name = props.goal.name
      form.targetAmount = props.goal.targetAmount
      form.currentAmount = props.goal.currentAmount
      form.deadline = props.goal.deadline || ''
      form.color = props.goal.color || '#10b981'
      form.icon = props.goal.icon || '🎯'
      targetDisplay.value = props.goal.targetAmount ? props.goal.targetAmount.toLocaleString('id-ID') : ''
      currentDisplay.value = props.goal.currentAmount ? props.goal.currentAmount.toLocaleString('id-ID') : ''
    } else {
      form.name = ''
      form.targetAmount = 0
      form.currentAmount = 0
      form.deadline = ''
      form.color = '#10b981'
      form.icon = '🎯'
      targetDisplay.value = ''
      currentDisplay.value = ''
    }
  }
})

const onTargetInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  const sanitized = val.replace(/[^0-9+\-*/().\s]/g, '')
  targetDisplay.value = sanitized
  const math = evaluateMathExpression(sanitized)
  if (math.isValid && math.result !== null) {
    form.targetAmount = math.result
  }
}

const onTargetBlur = () => {
  const math = evaluateMathExpression(targetDisplay.value)
  if (math.isValid && math.result !== null && math.result > 0) {
    form.targetAmount = math.result
    targetDisplay.value = math.result.toLocaleString('id-ID')
  }
}

const onCurrentInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  const sanitized = val.replace(/[^0-9+\-*/().\s]/g, '')
  currentDisplay.value = sanitized
  const math = evaluateMathExpression(sanitized)
  if (math.isValid && math.result !== null) {
    form.currentAmount = math.result
  }
}

const onCurrentBlur = () => {
  const math = evaluateMathExpression(currentDisplay.value)
  if (math.isValid && math.result !== null && math.result >= 0) {
    form.currentAmount = math.result
    currentDisplay.value = math.result.toLocaleString('id-ID')
  }
}

const handleSave = async () => {
  if (!form.name.trim()) {
    errorMessage.value = 'Nama target harus diisi'
    return
  }
  if (form.targetAmount <= 0) {
    errorMessage.value = 'Nominal target harus lebih dari 0'
    return
  }

  try {
    loading.value = true
    errorMessage.value = ''

    const payload = {
      name: form.name,
      targetAmount: form.targetAmount,
      currentAmount: form.currentAmount,
      deadline: form.deadline || null,
      color: form.color,
      icon: form.icon,
    }

    if (props.goal) {
      await $fetch(`/api/savings-goals/${props.goal.id}`, {
        method: 'PUT',
        body: payload,
      })
    } else {
      await $fetch('/api/savings-goals', {
        method: 'POST',
        body: payload,
      })
    }

    emit('saved')
    emit('close')
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Gagal menyimpan target tabungan'
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
          <div class="flex items-center gap-2.5">
            <span class="text-2xl">{{ form.icon }}</span>
            <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">
              {{ goal ? 'Ubah Target Tabungan' : 'Target Tabungan Baru' }}
            </h3>
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
          {{ errorMessage }}
        </div>

        <!-- Form fields -->
        <div class="space-y-4">
          <!-- Icon Picker -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Pilih Ikon</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="ic in icons"
                :key="ic"
                type="button"
                @click="form.icon = ic"
                class="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all"
                :class="form.icon === ic ? 'bg-primary-100 dark:bg-primary-950/60 ring-2 ring-primary-500 scale-105' : 'bg-gray-50 dark:bg-gray-800'"
              >
                {{ ic }}
              </button>
            </div>
          </div>

          <!-- Nama Target -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Nama Impian / Target</label>
            <input
              v-model="form.name"
              type="text"
              class="input"
              placeholder="misal: Dana Darurat, Beli Laptop, Liburan Jepang"
            />
          </div>

          <!-- Target Amount -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Target Nominal (Rp)</label>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 font-bold text-gray-400 text-sm">Rp</span>
              <input
                :value="targetDisplay"
                type="text"
                class="input pl-11 font-bold"
                placeholder="0"
                @input="onTargetInput"
                @blur="onTargetBlur"
              />
            </div>
          </div>

          <!-- Current Amount (Saldo Awal) -->
          <div v-if="!goal">
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Saldo Awal yang Sudah Terkumpul (Opsional)</label>
            <div class="relative flex items-center">
              <span class="absolute left-3.5 font-bold text-gray-400 text-sm">Rp</span>
              <input
                :value="currentDisplay"
                type="text"
                class="input pl-11 font-bold"
                placeholder="0"
                @input="onCurrentInput"
                @blur="onCurrentBlur"
              />
            </div>
          </div>

          <!-- Deadline -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Target Tercapai Pada (Opsional)</label>
            <input v-model="form.deadline" type="date" class="input" />
          </div>

          <!-- Color Picker -->
          <div>
            <label class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Warna Tema</label>
            <div class="flex gap-2.5">
              <button
                v-for="c in colors"
                :key="c"
                type="button"
                @click="form.color = c"
                class="w-7 h-7 rounded-full transition-transform"
                :style="{ backgroundColor: c }"
                :class="form.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : 'opacity-80 hover:opacity-100'"
              />
            </div>
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
            @click="handleSave"
            class="flex-1 py-3 rounded-xl bg-primary-500 text-white font-bold text-xs hover:bg-primary-600 shadow-md shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {{ loading ? 'Menyimpan...' : (goal ? 'Simpan Perubahan' : 'Buat Target 🚀') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

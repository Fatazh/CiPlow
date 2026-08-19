<script setup lang="ts">
// components/savings/SavingsGoalCard.vue — Visual progress card for a savings goal
const props = defineProps<{
  goal: {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
    percentage: number
    remaining: number
    deadline?: string | null
    color: string
    icon: string
    isCompleted: boolean
  }
}>()

const emit = defineEmits<{
  (e: 'deposit', goal: any): void
  (e: 'edit', goal: any): void
  (e: 'delete', goal: any): void
}>()

const { formatIDR, maskBalance } = useCurrency()

// Proyeksi estimasi tabungan bulanan yang dibutuhkan
const monthlyNeeded = computed(() => {
  if (!props.goal.deadline || props.goal.isCompleted || props.goal.remaining <= 0) return null
  const now = new Date()
  const deadline = new Date(props.goal.deadline)
  const diffMonths = Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()))
  return Math.ceil(props.goal.remaining / diffMonths)
})
</script>

<template>
  <div
    class="card rounded-2xl p-4 transition-all duration-200 hover:shadow-md relative overflow-hidden border"
    :class="goal.isCompleted ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-gray-100 dark:border-gray-800'"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs shrink-0"
          :style="{ backgroundColor: (goal.color || '#10b981') + '20' }"
        >
          {{ goal.icon || '🎯' }}
        </div>
        <div>
          <h4 class="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
            {{ goal.name }}
          </h4>
          <p v-if="goal.deadline" class="text-[10px] text-gray-400 mt-0.5">
            📅 Target: {{ new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
          </p>
          <p v-else class="text-[10px] text-gray-400 mt-0.5">
            🎯 Tanpa batas waktu
          </p>
        </div>
      </div>

      <!-- Badge / Actions -->
      <div class="flex items-center gap-1.5">
        <span
          v-if="goal.isCompleted"
          class="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
        >
          Tercapai 🎉
        </span>
        <button
          @click.stop="emit('edit', goal)"
          class="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-xs transition-colors"
          title="Ubah Target"
        >
          ✏️
        </button>
        <button
          @click.stop="emit('delete', goal)"
          class="w-7 h-7 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center text-xs transition-colors"
          title="Hapus"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Progress Numbers -->
    <div class="mt-4 space-y-1.5">
      <div class="flex items-baseline justify-between">
        <div>
          <span class="text-base font-black text-gray-800 dark:text-gray-100">
            {{ maskBalance(formatIDR(goal.currentAmount)) }}
          </span>
          <span class="text-[11px] text-gray-400 font-medium ml-1">
            / {{ maskBalance(formatIDR(goal.targetAmount)) }}
          </span>
        </div>
        <span class="text-xs font-black text-primary-500">
          {{ goal.percentage }}%
        </span>
      </div>

      <!-- Progress Bar -->
      <div class="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 shadow-xs"
          :style="{
            width: `${goal.percentage}%`,
            backgroundColor: goal.color || '#10b981'
          }"
        />
      </div>
    </div>

    <!-- Projection hint if deadline is set -->
    <div v-if="monthlyNeeded" class="mt-2.5 px-2.5 py-1.5 rounded-xl bg-primary-50/70 dark:bg-primary-950/30 text-[10px] text-primary-700 dark:text-primary-300 font-semibold flex items-center gap-1.5">
      <span>💡</span>
      <span>Butuh setoran rutin <b>~{{ formatIDR(monthlyNeeded) }}/bln</b> agar tercapai tepat waktu</span>
    </div>

    <!-- Quick Deposit Button -->
    <div class="mt-3.5 flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800/60">
      <span class="text-[11px] text-gray-400 font-medium">
        {{ goal.remaining > 0 ? `Kurang ${maskBalance(formatIDR(goal.remaining))} lagi` : 'Target tabungan sudah lunas!' }}
      </span>
      <button
        @click="emit('deposit', goal)"
        class="px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/40 dark:hover:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
      >
        <span>➕</span>
        <span>Setor Tabungan</span>
      </button>
    </div>
  </div>
</template>

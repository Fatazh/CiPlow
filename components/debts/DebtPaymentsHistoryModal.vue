<script setup lang="ts">
// components/debts/DebtPaymentsHistoryModal.vue — View installment payment logs for a debt/loan
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  debt: any | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { formatIDR } = useCurrency()

const close = () => {
  emit('update:modelValue', false)
}

const payments = computed(() => props.debt?.payments || [])
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
        v-if="modelValue && debt"
        class="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8"
        @click.self="close"
      >
        <Transition
          appear
          enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
          enter-from-class="opacity-0 translate-y-8 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-4 scale-95"
        >
          <div
            v-if="modelValue && debt"
            class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                  :class="debt.type === 'LEND' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-600'"
                >
                  {{ debt.type === 'LEND' ? '🤝' : '💳' }}
                </div>
                <div>
                  <h3 class="font-bold text-base text-gray-800 dark:text-gray-100 leading-tight">
                    Riwayat Pembayaran Cicilan
                  </h3>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ debt.type === 'LEND' ? 'Piutang kepada' : 'Hutang dari' }} <b>{{ debt.personName }}</b>
                  </p>
                </div>
              </div>
              <button
                @click="close"
                class="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <!-- Summary Card -->
            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 mb-5">
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="text-gray-400">Total Tagihan:</span>
                <span class="font-bold text-gray-800 dark:text-gray-200">{{ formatIDR(debt.totalAmount) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="text-gray-400">Sudah Terbayar:</span>
                <span class="font-bold text-emerald-500">{{ formatIDR(debt.paidAmount) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                <span class="font-semibold text-gray-500">Sisa Belum Lunas:</span>
                <span class="font-black text-rose-500">{{ formatIDR(debt.remainingAmount) }}</span>
              </div>
            </div>

            <!-- Payments List -->
            <div class="space-y-3">
              <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Histori Pembayaran</h4>

              <div v-if="!payments.length" class="text-center py-8 text-xs text-gray-400">
                Belum ada catatan pembayaran cicilan untuk transaksi ini.
              </div>

              <div v-else class="space-y-2.5">
                <div
                  v-for="(p, idx) in payments"
                  :key="p.id"
                  class="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-900 shadow-sm flex items-center justify-between gap-3"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center text-xs font-black">
                      #{{ payments.length - idx }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-gray-800 dark:text-gray-100">
                        {{ new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
                      </p>
                      <p class="text-[11px] text-gray-400 truncate">
                        <span>{{ p.walletName ? `Via ${p.walletName}` : 'Tanpa potong dompet' }}</span>
                        <span v-if="p.notes"> • {{ p.notes }}</span>
                      </p>
                    </div>
                  </div>

                  <span class="font-bold text-sm text-emerald-500 flex-shrink-0">
                    +{{ formatIDR(p.amount) }}
                  </span>
                </div>
              </div>
            </div>

            <button
              @click="close"
              class="w-full mt-6 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 text-xs transition-all"
            >
              Tutup
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// components/analytics/AiAdvisorCard.vue — Smart Gemini Financial Advisor
import { ref } from 'vue'

const activeTopic = ref<'OVERVIEW' | 'EXPENSE_OPTIMIZATION' | 'SAVINGS_STRATEGY' | 'DEBT_MANAGEMENT'>('OVERVIEW')
const customPrompt = ref('')
const loading = ref(false)
const advice = ref('')
const errorMessage = ref('')
const copied = ref(false)

const topics = [
  { id: 'OVERVIEW' as const, label: '🔍 Evaluasi Bulan Ini', desc: 'Skor kesehatan & ringkasan' },
  { id: 'EXPENSE_OPTIMIZATION' as const, label: '💡 Tips Pangkas Boros', desc: 'Kurangi pengeluaran terbesar' },
  { id: 'SAVINGS_STRATEGY' as const, label: '🎯 Strategi Tabungan', desc: 'Capai impian lebih cepat' },
  { id: 'DEBT_MANAGEMENT' as const, label: '⚖️ Manajemen Hutang', desc: 'Pelunasan & arus kas' },
]

const fetchAdvice = async (topicId?: typeof activeTopic.value) => {
  if (topicId) activeTopic.value = topicId

  loading.value = true
  errorMessage.value = ''
  copied.value = false

  try {
    const res: any = await $fetch('/api/ai/advisor', {
      method: 'POST',
      body: {
        topic: activeTopic.value,
        customPrompt: customPrompt.value.trim() || undefined,
      },
    })

    if (res.ok) {
      advice.value = res.advice
      customPrompt.value = ''
    }
  } catch (err: any) {
    errorMessage.value = err?.data?.message || 'Gagal memuat saran AI. Pastikan API key terpasang.'
  } finally {
    loading.value = false
  }
}

const copyAdvice = async () => {
  if (!advice.value) return
  try {
    await navigator.clipboard.writeText(advice.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Ignore clipboard error
  }
}
</script>

<template>
  <div class="card rounded-3xl p-5 border border-primary-100 dark:border-primary-900/30 bg-gradient-to-b from-primary-50/20 via-white to-white dark:from-primary-950/20 dark:via-surface-900 dark:to-surface-900 shadow-card relative overflow-hidden">
    <!-- Background glow -->
    <div class="absolute -right-12 -top-12 w-36 h-36 bg-primary-400/10 rounded-full blur-2xl pointer-events-none" />

    <!-- Card Header -->
    <div class="flex items-center justify-between mb-3.5">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-500 to-emerald-400 text-white flex items-center justify-center text-xl shadow-md shadow-primary-500/20 flex-shrink-0">
          ✨
        </div>
        <div>
          <h3 class="font-extrabold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-1.5 leading-tight">
            <span>Asisten Finansial AI</span>
            <span class="px-1.5 py-0.5 rounded-md bg-primary-500/10 text-primary-600 dark:text-primary-400 text-[9px] font-black uppercase tracking-wider">
              Gemini Pro
            </span>
          </h3>
          <p class="text-[11px] text-gray-400 mt-0.5">
            Analisis cerdas berbasis data pemasukan & pengeluaran nyata
          </p>
        </div>
      </div>
    </div>

    <!-- Topic Chips -->
    <div class="grid grid-cols-2 gap-2 mb-4">
      <button
        v-for="t in topics"
        :key="t.id"
        @click="fetchAdvice(t.id)"
        :disabled="loading"
        class="p-2.5 rounded-2xl text-left border transition-all duration-200 active:scale-95 flex flex-col gap-0.5"
        :class="activeTopic === t.id && advice
          ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20'
          : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700'"
      >
        <span class="text-xs font-bold truncate">{{ t.label }}</span>
        <span class="text-[10px] opacity-75 truncate">{{ t.desc }}</span>
      </button>
    </div>

    <!-- Custom question input -->
    <div class="flex gap-2 mb-4">
      <input
        v-model="customPrompt"
        type="text"
        :disabled="loading"
        placeholder="Tanya hal spesifik ke Asisten AI..."
        class="flex-1 px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        @keyup.enter="fetchAdvice()"
      />
      <button
        @click="fetchAdvice()"
        :disabled="loading"
        class="px-4 py-2.5 rounded-2xl bg-primary-500 text-white text-xs font-bold shadow-md shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1 flex-shrink-0"
      >
        <span>Tanya</span>
        <span>⚡</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-8 text-center space-y-3">
      <div class="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-xs font-semibold text-primary-600 dark:text-primary-400 animate-pulse">
        Gemini sedang menganalisis kesehatan keuangan Anda...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="errorMessage"
      class="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2"
    >
      <span>⚠️</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Advice Output Box -->
    <div
      v-else-if="advice"
      class="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-900/40 shadow-xs space-y-3 animate-fade-in"
    >
      <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
        <span class="text-[10px] font-black uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Saran & Rekomendasi Finansial
        </span>
        <button
          @click="copyAdvice"
          class="text-[11px] font-bold text-gray-400 hover:text-primary-500 flex items-center gap-1 transition-colors"
        >
          <span>{{ copied ? '✓ Tersalin' : '📋 Salin' }}</span>
        </button>
      </div>

      <!-- Rendered Advice text -->
      <div class="text-xs text-gray-700 dark:text-gray-200 leading-relaxed space-y-2 whitespace-pre-line font-normal">
        {{ advice }}
      </div>
    </div>

    <!-- Empty initial state banner -->
    <div
      v-else
      class="p-4 rounded-2xl bg-primary-50/40 dark:bg-primary-950/20 border border-primary-100/60 dark:border-primary-900/30 text-center space-y-1.5"
    >
      <p class="text-xs font-bold text-gray-700 dark:text-gray-200">
        Siap Mengevaluasi Keuangan Anda
      </p>
      <p class="text-[11px] text-gray-400">
        Pilih salah satu topik di atas untuk mendapatkan saran cerdas dan strategi penghematan dari AI.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BrainCircuitIcon, SendIcon, AlertCircleIcon, CopyIcon, CheckIcon } from 'lucide-vue-next'

const activeTopic = ref<'OVERVIEW' | 'EXPENSE_OPTIMIZATION' | 'SAVINGS_STRATEGY' | 'DEBT_MANAGEMENT'>('OVERVIEW')
const customPrompt = ref('')
const loading = ref(false)
const advice = ref('')
const errorMessage = ref('')
const copied = ref(false)

const topics = [
  { id: 'OVERVIEW' as const, label: 'Evaluasi Bulan Ini', desc: 'Skor kesehatan & ringkasan' },
  { id: 'EXPENSE_OPTIMIZATION' as const, label: 'Tips Pangkas Pengeluaran', desc: 'Kurangi pengeluaran terbesar' },
  { id: 'SAVINGS_STRATEGY' as const, label: 'Strategi Tabungan', desc: 'Capai target lebih terarah' },
  { id: 'DEBT_MANAGEMENT' as const, label: 'Manajemen Hutang', desc: 'Pelunasan & arus kas' },
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
    errorMessage.value = err?.data?.message || 'Gagal memuat saran. Pastikan API key terpasang.'
  } finally {
    loading.value = false
  }
}

interface AdviceItem {
  number: number
  title: string
  body: string
}

const formatInlineMarkdown = (text: string) => {
  if (!text) return ''
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  return safe.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
}

const parsedAdviceItems = computed<AdviceItem[]>(() => {
  if (!advice.value) return []
  
  const rawLines = advice.value.split('\n')
  const items: AdviceItem[] = []
  let currentItem: AdviceItem | null = null
  let autoIndex = 1

  for (const rawLine of rawLines) {
    const line = rawLine.trim()
    if (!line || line === '---' || line === '***' || line === '___') continue

    const matchNumbered = line.match(/^(\d+)[\.\)]\s*(.*)/)
    const matchBullet = line.match(/^[\*\-]\s*(.*)/)

    if (matchNumbered) {
      const num = parseInt(matchNumbered[1], 10)
      const content = matchNumbered[2]
      const titleMatch = content.match(/^\*\*(.*?)\*\*[\:\s]*(.*)/)
      
      currentItem = {
        number: num,
        title: titleMatch ? titleMatch[1].trim() : '',
        body: titleMatch ? titleMatch[2].trim() : content.trim(),
      }
      items.push(currentItem)
    } else if (matchBullet) {
      const content = matchBullet[1]
      const titleMatch = content.match(/^\*\*(.*?)\*\*[\:\s]*(.*)/)
      
      currentItem = {
        number: autoIndex++,
        title: titleMatch ? titleMatch[1].trim() : '',
        body: titleMatch ? titleMatch[2].trim() : content.trim(),
      }
      items.push(currentItem)
    } else if (currentItem) {
      if (currentItem.body) {
        currentItem.body += ' ' + line
      } else {
        currentItem.body = line
      }
    } else {
      const titleMatch = line.match(/^\*\*(.*?)\*\*[\:\s]*(.*)/)
      currentItem = {
        number: autoIndex++,
        title: titleMatch ? titleMatch[1].trim() : '',
        body: titleMatch ? titleMatch[2].trim() : line,
      }
      items.push(currentItem)
    }
  }

  return items
})

const copyAdvice = async () => {
  if (!advice.value) return
  try {
    await navigator.clipboard.writeText(advice.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
  }
}
</script>

<template>
  <div class="card rounded-3xl p-5 border border-primary-100 dark:border-primary-900/30 bg-gradient-to-b from-primary-50/20 via-white to-white dark:from-primary-950/20 dark:via-surface-900 dark:to-surface-900 shadow-card relative overflow-hidden">
    <div class="flex items-center justify-between mb-3.5">
      <div class="flex items-center gap-2.5">
        <div class="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
          <BrainCircuitIcon :size="20" :stroke-width="2" />
        </div>
        <div>
          <h3 class="font-extrabold text-sm text-gray-800 dark:text-gray-100 leading-tight">
            Asisten Finansial
          </h3>
          <p class="text-[11px] text-gray-400 mt-0.5">
            Analisis cerdas berbasis data pemasukan & pengeluaran nyata
          </p>
        </div>
      </div>
    </div>

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

    <div class="flex gap-2 mb-4">
      <input
        v-model="customPrompt"
        type="text"
        :disabled="loading"
        placeholder="Tanya hal spesifik ke Asisten..."
        class="flex-1 px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        @keyup.enter="fetchAdvice()"
      />
      <button
        @click="fetchAdvice()"
        :disabled="loading"
        class="px-4 py-2.5 rounded-2xl bg-primary-500 text-white text-xs font-bold shadow-md shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 flex-shrink-0"
      >
        <span>Tanya</span>
        <SendIcon :size="12" :stroke-width="2.5" />
      </button>
    </div>

    <div v-if="loading" class="py-8 text-center space-y-3">
      <div class="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-xs font-semibold text-primary-600 dark:text-primary-400">
        Menganalisis data keuangan Anda...
      </p>
    </div>

    <div
      v-else-if="errorMessage"
      class="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2"
    >
      <AlertCircleIcon :size="15" :stroke-width="2" class="flex-shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <div
      v-else-if="advice"
      class="p-4 rounded-2xl bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-900/40 shadow-xs space-y-3.5 animate-fade-in"
    >
      <div class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
        <span class="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Saran & Rekomendasi Finansial
        </span>
        <button
          @click="copyAdvice"
          class="text-[11px] font-bold text-gray-400 hover:text-primary-500 flex items-center gap-1 transition-colors"
        >
          <component :is="copied ? CheckIcon : CopyIcon" :size="13" />
          <span>{{ copied ? 'Tersalin' : 'Salin' }}</span>
        </button>
      </div>

      <!-- Numbered Breakpoint Cards -->
      <div class="space-y-2.5">
        <div
          v-for="item in parsedAdviceItems"
          :key="item.number"
          class="flex items-start gap-3 p-3 rounded-xl bg-gray-50/90 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 transition-colors"
        >
          <!-- Number Badge -->
          <div
            class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white font-black text-xs flex items-center justify-center shadow-xs mt-0.5"
          >
            {{ item.number }}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <h4
              v-if="item.title"
              class="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5 leading-snug"
            >
              {{ item.title }}
            </h4>
            <p
              class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed"
              v-html="formatInlineMarkdown(item.body)"
            />
          </div>
        </div>
      </div>
    </div>

    <div
      v-else
      class="p-4 rounded-2xl bg-primary-50/40 dark:bg-primary-950/20 border border-primary-100/60 dark:border-primary-900/30 text-center space-y-1.5"
    >
      <p class="text-xs font-bold text-gray-700 dark:text-gray-200">
        Siap Mengevaluasi Keuangan Anda
      </p>
      <p class="text-[11px] text-gray-400">
        Pilih salah satu topik di atas untuk mendapatkan saran terarah dan strategi penghematan.
      </p>
    </div>
  </div>
</template>

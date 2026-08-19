<script setup lang="ts">
// components/ui/FeedbackModal.vue — Interactive Rating & Bug Report Modal
import { ref, reactive, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    mode?: 'RATING' | 'BUG_REPORT'
  }>(),
  {
    mode: 'RATING',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [message: string]
}>()

// Form state
const rating = ref(5)
const hoverRating = ref(0)
const category = ref('UI / Tampilan')
const message = ref('')
const submitting = ref(false)
const errorMsg = ref('')

const bugCategories = [
  'UI / Tampilan & Grafis',
  'Pencatatan Transaksi & Saldo',
  'Hutang & Piutang',
  'Target Tabungan',
  'Ekspor / Impor Data',
  'AI Vision Scanner',
  'Keamanan & Autentikasi',
  'Lainnya',
]

const ratingLabels = [
  '',
  'Sangat Buruk 😞',
  'Kurang Memuaskan 🙁',
  'Cukup Baik 🙂',
  'Sangat Bagus 😊',
  'Luar Biasa Memuaskan! 🌟',
]

const activeRatingLabel = computed(() => {
  const current = hoverRating.value || rating.value
  return ratingLabels[current] || ''
})

const close = () => {
  emit('update:modelValue', false)
  message.value = ''
  errorMsg.value = ''
}

const handleSubmit = async () => {
  if (!message.value.trim()) {
    errorMsg.value = props.mode === 'RATING' ? 'Tuliskan sedikit ulasan atau saran Anda' : 'Jelaskan kendala / bug yang Anda temukan'
    return
  }

  submitting.value = true
  errorMsg.value = ''

  try {
    const payload = {
      type: props.mode,
      rating: props.mode === 'RATING' ? rating.value : undefined,
      category: props.mode === 'BUG_REPORT' ? category.value : undefined,
      message: message.value.trim(),
      metadata: {
        userAgent: navigator.userAgent,
        currentPath: window.location.pathname,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
    }

    const res: any = await $fetch('/api/feedback', {
      method: 'POST',
      body: payload,
    })

    emit('success', res.message || 'Terima kasih atas partisipasi Anda!')
    close()
  } catch (err: any) {
    errorMsg.value = err?.data?.message || 'Gagal mengirimkan data. Coba lagi.'
  } finally {
    submitting.value = false
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
            v-if="modelValue"
            class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
          >
            <!-- Header -->
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                  :class="mode === 'RATING' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-500' : 'bg-rose-100 dark:bg-rose-950/40 text-rose-500'"
                >
                  {{ mode === 'RATING' ? '⭐' : '🐛' }}
                </div>
                <div>
                  <h3 class="font-bold text-base text-gray-800 dark:text-gray-100 leading-tight">
                    {{ mode === 'RATING' ? 'Nilai Aplikasi CashPlow' : 'Laporkan Bug & Masalah' }}
                  </h3>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ mode === 'RATING' ? 'Bantu kami berkembang dengan ulasan Anda' : 'Bantu kami memperbaiki masalah aplikasi' }}
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

            <!-- Error Banner -->
            <div
              v-if="errorMsg"
              class="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2"
            >
              <span>⚠️</span>
              <span>{{ errorMsg }}</span>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4 text-sm">
              <!-- Rating Star Picker -->
              <div v-if="mode === 'RATING'" class="text-center py-3 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div class="flex items-center justify-center gap-2 text-3xl my-2">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    @click="rating = star"
                    @mouseenter="hoverRating = star"
                    @mouseleave="hoverRating = 0"
                    class="transition-transform active:scale-125 hover:scale-110 focus:outline-none p-1"
                  >
                    <span :class="(hoverRating || rating) >= star ? 'text-amber-400 drop-shadow-sm' : 'text-gray-300 dark:text-gray-600'">
                      ★
                    </span>
                  </button>
                </div>
                <span class="text-xs font-bold text-gray-700 dark:text-gray-300 animate-fade-in block h-4">
                  {{ activeRatingLabel }}
                </span>
              </div>

              <!-- Category Picker for Bug Report -->
              <div v-if="mode === 'BUG_REPORT'">
                <label class="block mb-1.5 text-xs font-semibold text-gray-500">Kategori Masalah</label>
                <select
                  v-model="category"
                  class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-xs"
                >
                  <option v-for="cat in bugCategories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>

              <!-- Message Input -->
              <div>
                <label class="block mb-1.5 text-xs font-semibold text-gray-500">
                  {{ mode === 'RATING' ? 'Ulasan & Masukan Anda' : 'Deskripsi Masalah / Bug' }}
                </label>
                <textarea
                  v-model="message"
                  rows="4"
                  required
                  :placeholder="mode === 'RATING' ? 'Tuliskan pengalaman Anda menggunakan CashPlow, fitur favorit, atau usulan fitur baru...' : 'Jelaskan kronologi bug yang terjadi, tombol yang diklik, atau pesan error yang muncul...'"
                  class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none text-xs leading-relaxed"
                ></textarea>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  @click="close"
                  class="flex-1 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 transition-all text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  :disabled="submitting"
                  class="flex-1 py-3.5 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50 text-xs"
                >
                  {{ submitting ? 'Mengirim...' : (mode === 'RATING' ? 'Kirim Penilaian' : 'Kirim Laporan') }}
                </button>
              </div>
            </form>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// components/transactions/ReceiptScannerModal.vue — AI Receipt Scanner Modal with Gemini Flash
import { compressImage } from '~/utils/imageCompressor'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'scanned', result: any): void
}>()

const isScanning = ref(false)
const errorMessage = ref('')
const previewImage = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

watch(() => props.show, (isOpen) => {
  if (!isOpen) {
    previewImage.value = null
    errorMessage.value = ''
    isScanning.value = false
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const onFileSelected = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validate image type
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Hanya file gambar (JPG, PNG, WebP) yang didukung.'
    return
  }

  isScanning.value = true
  errorMessage.value = ''

  try {
    // Compress image client-side (max 1200x1200, 0.8 quality) to reduce 5-15MB phone photos to ~150-300KB
    const compressedBase64 = await compressImage(file, 1200, 1200, 0.8)
    previewImage.value = compressedBase64
    await processScan(compressedBase64)
  } catch (err: any) {
    handleScanError(err)
  } finally {
    isScanning.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const handleScanError = (err: any) => {
  console.error('[AI Receipt Scanner Error]', err)
  const status = err?.statusCode || err?.status || err?.data?.statusCode || err?.response?.status
  const rawMsg = err?.data?.message || err?.message || ''

  if (status === 413 || rawMsg.includes('413') || rawMsg.toLowerCase().includes('too large')) {
    errorMessage.value = 'Ukuran foto struk terlalu besar. Coba ambil foto dengan jarak lebih dekat atau pencahayaan yang cukup.'
    return
  }

  if (status === 429 || rawMsg.includes('429') || rawMsg.toLowerCase().includes('too many requests')) {
    errorMessage.value = 'Terlalu banyak permintaan scan. Silakan tunggu 1 menit sebelum mencoba lagi.'
    return
  }

  if (status === 422 || rawMsg.includes('422') || rawMsg.toLowerCase().includes('tidak dapat dibaca') || rawMsg.toLowerCase().includes('struktur data')) {
    errorMessage.value = 'Struk atau tulisan tangan tidak dapat dibaca oleh AI. Pastikan foto struk memiliki pencahayaan terang dan tulisan yang jelas, atau catat transaksi secara manual.'
    return
  }

  if (rawMsg && typeof rawMsg === 'string' && !rawMsg.includes('[POST]') && !rawMsg.includes('statusCode') && !rawMsg.includes('FetchError')) {
    errorMessage.value = rawMsg
    return
  }

  errorMessage.value = 'Struk tidak dapat diproses. Pastikan struk atau catatan bon memiliki tulisan yang terbaca dengan jelas, atau catat transaksi secara manual.'
}

const processScan = async (base64Image: string) => {
  try {
    const response: any = await $fetch('/api/ai/scan-receipt', {
      method: 'POST',
      body: {
        image: base64Image,
      },
    })

    if (response.ok && response.data) {
      emit('scanned', response.data)
      emit('close')
    } else {
      throw new Error('Struk tidak dapat diproses oleh AI.')
    }
  } catch (err: any) {
    handleScanError(err)
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      @click.self="!isScanning && emit('close')"
    >
      <div class="bg-white dark:bg-surface-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-5 animate-scale-up text-center">
        <!-- Hidden file input (supports camera capture on mobile) -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          @change="onFileSelected"
        />

        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xl">🤖</span>
            <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">
              AI Scan Struk Belanja
            </h3>
          </div>
          <button
            v-if="!isScanning"
            @click="emit('close')"
            class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Scanning Loader State -->
        <div v-if="isScanning" class="py-8 space-y-4 animate-pulse">
          <div class="relative w-24 h-24 mx-auto">
            <div class="absolute inset-0 rounded-3xl bg-primary-500/20 animate-ping" />
            <div class="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary-500 to-emerald-400 flex items-center justify-center text-4xl shadow-xl shadow-primary-500/30 text-white">
              ⚡
            </div>
          </div>
          <div>
            <h4 class="text-sm font-bold text-gray-800 dark:text-gray-100">
              Gemini AI Sedang Membaca Struk...
            </h4>
            <p class="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Mengekstrak nama toko, nominal, tanggal, dan rincian belanjaan secara otomatis.
            </p>
          </div>
        </div>

        <!-- Default Upload State -->
        <div v-else class="space-y-4">
          <!-- Error alert -->
          <div v-if="errorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold text-left">
            ⚠️ {{ errorMessage }}
          </div>

          <!-- Dropzone / Clickzone -->
          <div
            @click="triggerFileInput"
            class="border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 rounded-3xl p-8 cursor-pointer transition-all duration-200 bg-gray-50/50 dark:bg-gray-800/30 group hover:bg-primary-50/20"
          >
            <div class="w-16 h-16 rounded-2xl bg-white dark:bg-surface-800 shadow-md flex items-center justify-center text-3xl mx-auto mb-3.5 group-hover:scale-110 transition-transform">
              📸
            </div>
            <p class="text-sm font-bold text-gray-800 dark:text-gray-200">
              Ambil Foto / Pilih Struk Belanja
            </p>
            <p class="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
              Mendukung struk Indomaret, Alfamart, restoran, SPBU, atau kuitansi toko
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2.5">
            <button
              type="button"
              @click="triggerFileInput"
              class="flex-1 py-3 rounded-2xl bg-primary-500 text-white font-bold text-xs hover:bg-primary-600 shadow-md shadow-primary-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>📷</span>
              <span>Buka Kamera / Galeri</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

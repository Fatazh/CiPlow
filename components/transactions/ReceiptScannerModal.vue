<script setup lang="ts">
// components/transactions/ReceiptScannerModal.vue — AI Receipt Scanner Modal with Gemini Flash
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

const onFileSelected = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validate image type
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Hanya file gambar (JPG, PNG, WebP) yang didukung.'
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    previewImage.value = event.target?.result as string
    processScan(previewImage.value)
  }
  reader.readAsDataURL(file)
}

const processScan = async (base64Image: string) => {
  try {
    isScanning.value = true
    errorMessage.value = ''

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
      throw new Error('Gagal mengekstrak data struk.')
    }
  } catch (err: any) {
    let msg = err?.data?.message || err?.message || 'Gagal membaca struk dengan AI. Coba foto lebih dekat & jelas.'
    if (typeof msg === 'string' && msg.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(msg)
        msg = parsed?.error?.message || msg
      } catch {
        // use original
      }
    }
    errorMessage.value = msg
  } finally {
    isScanning.value = false
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

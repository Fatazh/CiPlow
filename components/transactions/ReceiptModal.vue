<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean
    imageUrl?: string | null
    title?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', val: boolean): void
}>()

const close = () => {
    emit('update:modelValue', false)
}

const downloadImage = () => {
    if (!props.imageUrl) return
    const a = document.createElement('a')
    a.href = props.imageUrl
    a.download = `struk-transaksi-${Date.now()}.png`
    a.click()
}
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="modelValue && imageUrl"
                class="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                @click.self="close"
            >
                <div class="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl animate-scale-in">
                    <!-- Header -->
                    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">🧾</span>
                            <span class="text-sm font-bold text-white">{{ title || 'Foto Bukti / Struk Transaksi' }}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button
                                class="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-bold flex items-center gap-1.5"
                                title="Unduh Gambar"
                                @click="downloadImage"
                            >
                                <span>📥</span>
                                <span>Unduh</span>
                            </button>
                            <button
                                class="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
                                @click="close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <!-- Image Display Area -->
                    <div class="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40 min-h-[300px]">
                        <img
                            :src="imageUrl"
                            :alt="title || 'Struk Transaksi'"
                            class="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
                        />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

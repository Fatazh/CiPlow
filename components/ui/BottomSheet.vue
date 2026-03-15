<script setup lang="ts">
/**
 * BottomSheet — Reusable mobile-first bottom sheet / modal
 * Slides up from bottom with backdrop overlay.
 */

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    subtitle?: string
    maxHeight?: string
    persistent?: boolean // If true, clicking backdrop won't close
  }>(),
  {
    title: '',
    subtitle: '',
    maxHeight: '85vh',
    persistent: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const close = () => {
  if (!props.persistent) {
    emit('update:modelValue', false)
  }
}

// Lock body scroll when open
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
        @click="close"
      />
    </Transition>

    <!-- Sheet -->
    <Transition
      enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="modelValue"
        class="
          fixed bottom-0 inset-x-0 z-[95]
          flex flex-col
          w-full max-w-app mx-auto
          rounded-t-3xl
          bg-white dark:bg-surface-900
          border-t border-gray-100 dark:border-gray-800
          shadow-xl
          pb-safe
        "
        :style="{ maxHeight }"
      >
        <!-- Drag handle -->
        <div class="flex justify-center pt-3 pb-1">
          <div class="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        <!-- Header -->
        <div
          v-if="title || $slots.header"
          class="px-5 pb-3 flex items-center justify-between"
        >
          <slot name="header">
            <div>
              <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">
                {{ title }}
              </h3>
              <p
                v-if="subtitle"
                class="text-xs text-gray-400 dark:text-gray-500 mt-0.5"
              >
                {{ subtitle }}
              </p>
            </div>
          </slot>

          <!-- Close button -->
          <button
            class="
              flex items-center justify-center
              w-8 h-8 rounded-full
              hover:bg-gray-100 dark:hover:bg-gray-800
              text-gray-400 dark:text-gray-500
              transition-colors duration-150
              active:scale-90
            "
            aria-label="Tutup"
            @click="emit('update:modelValue', false)"
          >
            <svg
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div class="divider" />

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-5 py-4">
          <slot />
        </div>

        <!-- Footer (optional) -->
        <div v-if="$slots.footer" class="px-5 pb-5 pt-2">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

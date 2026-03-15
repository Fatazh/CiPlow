<script setup lang="ts">
/**
 * ConfirmDialog — Reusable confirmation modal
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    message?: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'default'
    icon?: string
    loading?: boolean
  }>(),
  {
    title: 'Konfirmasi',
    message: 'Apakah kamu yakin?',
    confirmText: 'Ya',
    cancelText: 'Batal',
    variant: 'danger',
    icon: '⚠️',
    loading: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const close = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const confirm = () => {
  emit('confirm')
}

const confirmClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30'
    case 'warning':
      return 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30'
    default:
      return 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30'
  }
})
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
        class="
          fixed inset-0 z-[100]
          flex items-end justify-center
          bg-black/50 backdrop-blur-sm
          px-4 pb-8
        "
        @click.self="close"
      >
        <Transition
          enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
          enter-from-class="opacity-0 translate-y-8 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 translate-y-4 scale-95"
        >
          <div
            v-if="modelValue"
            class="
              w-full max-w-app
              card rounded-3xl p-6
              flex flex-col items-center text-center gap-4
            "
          >
            <!-- Icon -->
            <div
              class="
                w-16 h-16 rounded-full
                flex items-center justify-center
                text-3xl
              "
              :class="
                variant === 'danger'
                  ? 'bg-rose-100 dark:bg-rose-950/50'
                  : variant === 'warning'
                    ? 'bg-amber-100 dark:bg-amber-950/50'
                    : 'bg-primary-100 dark:bg-primary-950/50'
              "
            >
              {{ icon }}
            </div>

            <!-- Text -->
            <div>
              <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">
                {{ title }}
              </h3>
              <p class="text-sm text-gray-400 dark:text-gray-500 mt-1 max-w-[260px] mx-auto">
                {{ message }}
              </p>
            </div>

            <!-- Buttons -->
            <div class="flex gap-3 w-full">
              <button
                class="
                  flex-1 py-3 rounded-xl
                  border border-gray-200 dark:border-gray-700
                  text-sm font-semibold
                  text-gray-600 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  active:scale-95
                  transition-all duration-150
                "
                :disabled="loading"
                @click="close"
              >
                {{ cancelText }}
              </button>
              <button
                class="
                  flex-1 py-3 rounded-xl
                  text-sm font-bold
                  active:scale-95
                  transition-all duration-150
                  flex items-center justify-center gap-2
                "
                :class="confirmClass"
                :disabled="loading"
                @click="confirm"
              >
                <svg
                  v-if="loading"
                  class="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

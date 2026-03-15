<script setup lang="ts">
/**
 * Toast — Lightweight notification toast
 * Auto-dismisses after a configurable duration.
 */

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
  }>(),
  {
    type: 'success',
    duration: 3000,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Auto-dismiss timer
let timer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        emit('update:modelValue', false)
      }, props.duration)
    }
  },
)

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})

const config = computed(() => {
  switch (props.type) {
    case 'success':
      return {
        icon: '✅',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50',
        text: 'text-emerald-700 dark:text-emerald-300',
      }
    case 'error':
      return {
        icon: '❌',
        bg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/50',
        text: 'text-rose-700 dark:text-rose-300',
      }
    case 'warning':
      return {
        icon: '⚠️',
        bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50',
        text: 'text-amber-700 dark:text-amber-300',
      }
    case 'info':
      return {
        icon: 'ℹ️',
        bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/50',
        text: 'text-blue-700 dark:text-blue-300',
      }
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 -translate-y-4 scale-95"
    >
      <div
        v-if="modelValue"
        class="
          fixed top-4 inset-x-0 z-[200]
          flex justify-center px-4
        "
      >
        <div
          class="
            flex items-center gap-2.5
            px-4 py-3 rounded-2xl
            border shadow-card-md
            max-w-app w-full
          "
          :class="config?.bg"
        >
          <span class="text-base leading-none flex-shrink-0">{{ config?.icon }}</span>
          <span class="text-sm font-semibold flex-1" :class="config?.text">
            {{ message }}
          </span>
          <button
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            @click="emit('update:modelValue', false)"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

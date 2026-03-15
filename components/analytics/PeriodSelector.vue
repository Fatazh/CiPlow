<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon, CheckIcon } from 'lucide-vue-next'

// ── Types ──────────────────────────────────────────────────────
interface MonthOption {
  month: number
  year: number
  label: string
  isCurrent?: boolean
}

// ── Props ──────────────────────────────────────────────────────
interface Props {
  modelValue: { month: number; year: number }
  availableMonths?: MonthOption[]
  minYear?: number
  maxYear?: number
}

const props = withDefaults(defineProps<Props>(), {
  availableMonths: () => [],
  minYear: 2020,
  maxYear: new Date().getFullYear(),
})

// ── Emits ──────────────────────────────────────────────────────
const emit = defineEmits<{
  'update:modelValue': [value: { month: number; year: number }]
}>()

// ── State ──────────────────────────────────────────────────────
const showDropdown = ref(false)
const dropdownRef  = ref<HTMLElement | null>(null)

// ── Current displayed label ────────────────────────────────────
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const currentLabel = computed(() =>
  `${MONTHS_ID[props.modelValue.month - 1]} ${props.modelValue.year}`,
)

// ── Is current month? ──────────────────────────────────────────
const now = new Date()
const isCurrentMonth = computed(
  () =>
    props.modelValue.month === now.getMonth() + 1 &&
    props.modelValue.year === now.getFullYear(),
)

// ── Navigation ─────────────────────────────────────────────────
const canGoPrev = computed(() => {
  const { month, year } = props.modelValue
  // Don't go past minYear January
  return !(year === props.minYear && month === 1)
})

const canGoNext = computed(() => {
  // Don't go past current month
  return !isCurrentMonth.value
})

const goPrev = () => {
  if (!canGoPrev.value) return
  const { month, year } = props.modelValue
  if (month === 1) {
    emit('update:modelValue', { month: 12, year: year - 1 })
  } else {
    emit('update:modelValue', { month: month - 1, year })
  }
}

const goNext = () => {
  if (!canGoNext.value) return
  const { month, year } = props.modelValue
  if (month === 12) {
    emit('update:modelValue', { month: 1, year: year + 1 })
  } else {
    emit('update:modelValue', { month: month + 1, year })
  }
}

const goToNow = () => {
  emit('update:modelValue', {
    month: now.getMonth() + 1,
    year:  now.getFullYear(),
  })
}

// ── Dropdown select ────────────────────────────────────────────
const selectMonth = (option: MonthOption) => {
  emit('update:modelValue', { month: option.month, year: option.year })
  showDropdown.value = false
}

const isSelected = (option: MonthOption) =>
  option.month === props.modelValue.month &&
  option.year  === props.modelValue.year

// ── Click-outside to close dropdown ───────────────────────────
onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

const handleOutsideClick = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-2">

    <!-- ── Prev Button ──────────────────────────────────────── -->
    <button
      class="
        flex items-center justify-center
        w-9 h-9 rounded-xl
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900
        text-gray-500 dark:text-gray-400
        transition-all duration-150
        active:scale-90
      "
      :class="
        canGoPrev
          ? 'hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30'
          : 'opacity-30 cursor-not-allowed'
      "
      :disabled="!canGoPrev"
      aria-label="Bulan sebelumnya"
      @click="goPrev"
    >
      <ChevronLeftIcon :size="18" :stroke-width="2.5" />
    </button>

    <!-- ── Month label / dropdown trigger ──────────────────── -->
    <div ref="dropdownRef" class="relative flex-1">
      <button
        class="
          w-full flex items-center justify-center gap-2
          px-4 h-9 rounded-xl
          border border-gray-200 dark:border-gray-700
          bg-white dark:bg-gray-900
          text-sm font-semibold text-gray-800 dark:text-gray-100
          hover:border-primary-400 dark:hover:border-primary-600
          hover:bg-primary-50 dark:hover:bg-primary-950/30
          transition-all duration-150
          active:scale-95
          select-none
        "
        aria-label="Pilih periode"
        @click="showDropdown = !showDropdown"
      >
        <CalendarIcon :size="14" :stroke-width="2" class="text-primary-500 flex-shrink-0" />
        <span class="truncate">{{ currentLabel }}</span>

        <!-- "Bulan ini" badge -->
        <span
          v-if="isCurrentMonth"
          class="
            flex-shrink-0
            text-[9px] font-bold uppercase tracking-wide
            px-1.5 py-0.5 rounded-full
            bg-primary-100 text-primary-600
            dark:bg-primary-950/60 dark:text-primary-400
          "
        >
          Ini
        </span>

        <!-- Dropdown chevron -->
        <svg
          class="w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200"
          :class="showDropdown ? 'rotate-180' : ''"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <!-- ── Dropdown ─────────────────────────────────────── -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-1 scale-95"
      >
        <div
          v-if="showDropdown"
          class="
            absolute top-full left-0 right-0 mt-2 z-50
            card rounded-2xl overflow-hidden
            shadow-card-md
            border border-gray-100 dark:border-gray-800
          "
        >
          <!-- Dropdown title -->
          <div class="px-3 pt-3 pb-2">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Pilih Periode
            </p>
          </div>

          <!-- Month list -->
          <div class="px-2 pb-2 space-y-0.5">
            <button
              v-for="option in availableMonths"
              :key="`${option.year}-${option.month}`"
              class="
                w-full flex items-center gap-2.5
                px-3 py-2.5 rounded-xl
                text-left
                transition-all duration-150
                active:scale-98
              "
              :class="
                isSelected(option)
                  ? 'bg-primary-500 text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
              "
              @click="selectMonth(option)"
            >
              <!-- Check icon for selected -->
              <span class="flex-shrink-0 w-4">
                <CheckIcon
                  v-if="isSelected(option)"
                  :size="14"
                  :stroke-width="2.5"
                  class="text-white"
                />
              </span>

              <!-- Label -->
              <span class="flex-1 text-sm font-semibold">{{ option.label }}</span>

              <!-- "Bulan ini" indicator -->
              <span
                v-if="option.isCurrent && !isSelected(option)"
                class="
                  flex-shrink-0 text-[9px] font-bold uppercase tracking-wide
                  px-1.5 py-0.5 rounded-full
                  bg-primary-100 text-primary-600
                  dark:bg-primary-950/60 dark:text-primary-400
                "
              >
                Ini
              </span>
              <span
                v-else-if="option.isCurrent && isSelected(option)"
                class="
                  flex-shrink-0 text-[9px] font-bold uppercase tracking-wide
                  px-1.5 py-0.5 rounded-full
                  bg-white/30 text-white
                "
              >
                Ini
              </span>
            </button>
          </div>

          <!-- Go to current month shortcut -->
          <div
            v-if="!isCurrentMonth"
            class="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 mt-1"
          >
            <button
              class="
                w-full flex items-center justify-center gap-1.5
                py-2 rounded-xl
                text-xs font-semibold
                text-primary-600 dark:text-primary-400
                hover:bg-primary-50 dark:hover:bg-primary-950/30
                transition-all duration-150
                active:scale-95
              "
              @click="goToNow"
            >
              <CalendarIcon :size="12" :stroke-width="2.5" />
              Ke Bulan Ini
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- ── Next Button ──────────────────────────────────────── -->
    <button
      class="
        flex items-center justify-center
        w-9 h-9 rounded-xl
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900
        text-gray-500 dark:text-gray-400
        transition-all duration-150
        active:scale-90
      "
      :class="
        canGoNext
          ? 'hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/30'
          : 'opacity-30 cursor-not-allowed'
      "
      :disabled="!canGoNext"
      aria-label="Bulan berikutnya"
      @click="goNext"
    >
      <ChevronRightIcon :size="18" :stroke-width="2.5" />
    </button>

  </div>
</template>

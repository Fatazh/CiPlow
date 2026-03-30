<script setup lang="ts">
// pages/lock.vue — App Lock PIN Screen

definePageMeta({
  layout: false, // Clean full-screen
})

const store = useUserStore()
const router = useRouter()

const pin = ref('')
const error = ref(false)

const handleUnlock = () => {
  if (store.unlock(pin.value)) {
    router.replace('/')
  } else {
    error.value = true
    pin.value = ''
    setTimeout(() => error.value = false, 500)
  }
}

// Num pad handler
const addDigit = (digit: string) => {
  if (pin.value.length < 6) {
    pin.value += digit
  }
  if (pin.value.length === 6) {
    handleUnlock()
  }
}

const removeDigit = () => {
  pin.value = pin.value.slice(0, -1)
}

// Redirect if somehow not locked
onMounted(() => {
  if (!store.hasPin) {
    router.replace('/')
  }
})
</script>

<template>
  <div class="fixed inset-0 bg-surface-950 flex flex-col items-center justify-center p-6 z-[999] animate-fade-in">
    <!-- Icon & Title -->
    <div class="text-center mb-10">
      <div class="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/30">
        <span class="text-3xl">🔐</span>
      </div>
      <h1 class="text-xl font-bold text-white mb-1">Aplikasi Terkunci</h1>
      <p class="text-sm text-gray-500">Masukkan PIN Keamanan</p>
    </div>

    <!-- PIN Indicators -->
    <div class="flex gap-4 mb-12" :class="{ 'animate-shake': error }">
      <div v-for="i in 6" :key="i" 
           class="w-4 h-4 rounded-full border-2 transition-all duration-200"
           :class="pin.length >= i ? 'bg-primary-500 border-primary-500' : 'border-gray-700'" />
    </div>

    <!-- Number Pad -->
    <div class="grid grid-cols-3 gap-6 w-full max-w-[280px]">
      <button v-for="n in 9" :key="n" 
              class="w-16 h-16 rounded-full bg-surface-900 text-white text-2xl font-bold flex items-center justify-center active:bg-surface-800 active:scale-90 transition-all"
              @click="addDigit(n.toString())">
        {{ n }}
      </button>
      <div class="w-16 h-16" /> <!-- Spacer -->
      <button class="w-16 h-16 rounded-full bg-surface-900 text-white text-2xl font-bold flex items-center justify-center active:bg-surface-800 active:scale-90 transition-all"
              @click="addDigit('0')">
        0
      </button>
      <button class="w-16 h-16 rounded-full bg-surface-900 text-gray-400 text-xl flex items-center justify-center active:bg-surface-800 active:scale-90 transition-all"
              @click="removeDigit">
        ⌫
      </button>
    </div>

    <!-- Forgot Pin -->
    <p class="mt-12 text-xs text-gray-600">Lupa PIN? Silakan login ulang aplikasi.</p>
  </div>
</template>

<style scoped>
.animate-shake {
  animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>

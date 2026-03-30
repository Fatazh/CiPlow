import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const { user, updateUser } = useAuth()
  
  // ── Currency State ──────────────────────────────────────────
  const _currency = ref('IDR')
  const locale = ref('id-ID')
  const currency = computed(() => user.value?.currency || _currency.value)

  // ── Lock State ──────────────────────────────────────────────
  const isLocked = ref(false)
  const appPin = ref<string | null>(null)
  const lastActive = ref(Date.now())
  const lockTimeout = 3 * 60 * 1000 // 3 minutes in ms

  // Initial load
  if (import.meta.client) {
    const savedCurrency = localStorage.getItem('CashPlow-currency')
    if (savedCurrency) _currency.value = savedCurrency

    const savedPin = localStorage.getItem('ciplow_app_pin')
    if (savedPin) appPin.value = savedPin
  }

  const setCurrency = async (newCurrency: string) => {
    _currency.value = newCurrency
    if (import.meta.client) {
      localStorage.setItem('CashPlow-currency', newCurrency)
    }
    
    if (user.value) {
      try {
        await updateUser({ currency: newCurrency })
      } catch (err) {
        console.error('Failed to update currency on server', err)
      }
    }
  }

  // ── Lock Logic ──────────────────────────────────────────────
  const setPin = (pin: string) => {
    appPin.value = pin
    if (import.meta.client) {
      localStorage.setItem('ciplow_app_pin', pin)
    }
  }

  const checkAutoLock = () => {
    if (!appPin.value) return
    const now = Date.now()
    if (now - lastActive.value > lockTimeout) {
      isLocked.value = true
    }
  }

  const unlock = (pin: string) => {
    if (pin === appPin.value) {
      isLocked.value = false
      lastActive.value = Date.now()
      return true
    }
    return false
  }

  const updateActivity = () => {
    lastActive.value = Date.now()
  }

  return {
    currency,
    locale,
    setCurrency,
    // Lock exports
    isLocked,
    hasPin: computed(() => !!appPin.value),
    setPin,
    unlock,
    checkAutoLock,
    updateActivity
  }
})


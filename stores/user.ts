import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const { user, updateUser } = useAuth()
  
  // ── Currency State ──────────────────────────────────────────
  const _currency = ref('IDR')
  const locale = ref('id-ID')
  const currency = computed(() => user.value?.currency || _currency.value)

  // Initial load
  if (import.meta.client) {
    const savedCurrency = localStorage.getItem('CashPlow-currency')
    if (savedCurrency) _currency.value = savedCurrency

    // Clean up any legacy PIN data
    localStorage.removeItem('ciplow_app_pin')
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

  return {
    currency,
    locale,
    setCurrency
  }
})

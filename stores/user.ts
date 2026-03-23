import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const { user, updateUser } = useAuth()
  
  // Use user.value?.currency as source of truth if available, otherwise fallback
  const _currency = ref('IDR')
  const locale = ref('id-ID')

  const currency = computed(() => user.value?.currency || _currency.value)

  // Load from local storage initially if available
  if (import.meta.client) {
    const savedCurrency = localStorage.getItem('CashPlow-currency')
    if (savedCurrency) _currency.value = savedCurrency
  }

  const setCurrency = async (newCurrency: string) => {
    _currency.value = newCurrency
    if (import.meta.client) {
      localStorage.setItem('CashPlow-currency', newCurrency)
    }
    
    // Also update server-side if logged in
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

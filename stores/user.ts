import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const { user, updateUser } = useAuth()
  
  // ── Currency State ──────────────────────────────────────────
  const _currency = ref('IDR')
  const locale = ref('id-ID')
  const currency = computed(() => user.value?.currency || _currency.value)

  // ── Privacy Mode (Hide/Mask Balance Globally) ───────────────
  const isBalanceHidden = ref(false)

  // Initial load
  if (import.meta.client) {
    const savedCurrency = localStorage.getItem('CashPlow-currency')
    if (savedCurrency) _currency.value = savedCurrency

    const savedHideBalance = localStorage.getItem('ciplow_hide_balance')
    if (savedHideBalance !== null) {
      isBalanceHidden.value = savedHideBalance === 'true'
    }

    // Clean up any legacy PIN data
    localStorage.removeItem('ciplow_app_pin')
  }

  const toggleBalanceHidden = () => {
    isBalanceHidden.value = !isBalanceHidden.value
    if (import.meta.client) {
      localStorage.setItem('ciplow_hide_balance', String(isBalanceHidden.value))
    }
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
    isBalanceHidden,
    toggleBalanceHidden,
    setCurrency
  }
})

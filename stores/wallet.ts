import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useWalletStore = defineStore('wallet', () => {
  const wallets = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const userStore = useUserStore()
  
  // Cache for exchange rates to avoid redundant API calls
  const ratesCache = ref<Record<string, number>>({})

  const fetchWallets = async () => {
    loading.value = true
    try {
      const response = await $fetch<any>('/api/wallets')
      wallets.value = response.data || []
      
      // After fetching wallets, pre-fetch exchange rates for any currencies that differ from base currency
      await fetchRequiredRates()
    } catch (e: any) {
      error.value = e.message || 'Gagal memuat dompet'
    } finally {
      loading.value = false
    }
  }
  
  const fetchRequiredRates = async () => {
    const baseCurrency = userStore.currency || 'IDR'
    const uniqueCurrencies = new Set(wallets.value.map(w => w.currency || 'IDR'))
    
    for (const targetCurrency of uniqueCurrencies) {
      if (baseCurrency === targetCurrency) continue
      
      const key = `${targetCurrency}_${baseCurrency}`
      if (ratesCache.value[key]) continue // Already cached
      
      try {
        const rateRes = await $fetch<any>(`/api/exchange-rates?base=${targetCurrency}&target=${baseCurrency}`)
        if (rateRes && rateRes.rate) {
          ratesCache.value[key] = rateRes.rate
        }
      } catch (err) {
        console.error(`Failed to fetch rate for ${targetCurrency} to ${baseCurrency}`, err)
      }
    }
  }

  // Calculate total balance normalized to the user's base currency
  const totalBalance = computed(() => {
    const baseCurrency = userStore.currency || 'IDR'
    
    return wallets.value.reduce((acc, wallet) => {
      const walletCurrency = wallet.currency || 'IDR'
      let balance = Number(wallet.balance || 0)
      
      if (walletCurrency !== baseCurrency) {
        const key = `${walletCurrency}_${baseCurrency}`
        const rate = ratesCache.value[key]
        if (rate) {
          balance = balance * rate
        } else {
          // If rate is missing, we still sum it but warn. In real app, might want to trigger a fetch.
          console.warn(`Missing exchange rate for ${walletCurrency} to ${baseCurrency}`)
        }
      }
      
      return acc + balance
    }, 0)
  })

  return {
    wallets,
    loading,
    error,
    fetchWallets,
    totalBalance,
    ratesCache
  }
})

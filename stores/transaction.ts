import { defineStore } from 'pinia'

export const useTransactionStore = defineStore('transaction', () => {
  const transactions = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTransactions = async (params: { month?: number, year?: number, limit?: number } = {}) => {
    loading.value = true
    try {
      const queryParams = new URLSearchParams()
      if (params.month) queryParams.append('month', String(params.month))
      if (params.year) queryParams.append('year', String(params.year))
      if (params.limit) queryParams.append('limit', String(params.limit))

      const response = await $fetch<any>(`/api/transactions?${queryParams.toString()}`)
      transactions.value = response.data || []
    } catch (e: any) {
      error.value = e.message || 'Gagal memuat transaksi'
    } finally {
      loading.value = false
    }
  }

  return {
    transactions,
    loading,
    error,
    fetchTransactions
  }
})

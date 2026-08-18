// composables/useOfflineSync.ts
// Logic to handle offline storage and background synchronization

const isSyncing = ref(false)
const syncError = ref<string | null>(null)

export const useOfflineSync = () => {
  const isOnline = useOnline()
  
  // Storage key for pending transactions
  const STORAGE_KEY = 'ciplow_pending_transactions'

  // ── Save Transaction Locally ───────────────────────────────
  const saveOffline = (payload: any) => {
    if (!import.meta.client) return null
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const newEntry = {
      ...payload,
      id: `local_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isOffline: true
    }
    
    pending.push(newEntry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending))
    return newEntry
  }

  // ── Sync Pending Transactions to Server ────────────────────
  const syncTransactions = async () => {
    if (!import.meta.client || isSyncing.value) return
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (pending.length === 0) return

    isSyncing.value = true
    syncError.value = null
    console.log(`[Sync] Attempting to sync ${pending.length} transactions...`)
    
    const remaining = []
    let successCount = 0

    for (const tx of pending) {
      try {
        // Remove the local ID and offline flag before sending
        const { id, isOffline, ...cleanPayload } = tx
        
        await $fetch('/api/transactions', {
          method: 'POST',
          body: cleanPayload
        })
        
        successCount++
      } catch (err: any) {
        console.error('[Sync] Failed to sync transaction', tx, err)
        syncError.value = err?.data?.message || 'Gagal menyinkronkan beberapa transaksi offline'
        remaining.push(tx) // Keep it in the queue if it failed
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
    isSyncing.value = false

    if (successCount > 0) {
      // Trigger a refresh of the transaction list
      refreshNuxtData('transactions-list')
      refreshNuxtData('dashboard-summary')
      refreshNuxtData('wallets-list')
      
      console.log(`[Sync] Successfully synced ${successCount} transactions.`)
    }
  }

  // ── Watch for online status to trigger sync ────────────────
  if (import.meta.client) {
    watch(isOnline, (online) => {
      if (online) {
        syncTransactions()
      }
    })
  }

  return {
    saveOffline,
    syncTransactions,
    isSyncing: readonly(isSyncing),
    syncError: readonly(syncError),
    hasPending: computed(() => {
      if (!import.meta.client) return false
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').length > 0
    })
  }
}

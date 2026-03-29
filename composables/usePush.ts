// composables/usePush.ts
// Push Notification Composable

export function usePush() {
  const isSupported = ref(false)
  const isEnabled = ref(false)
  const loading = ref(false)

  onMounted(() => {
    if (import.meta.client) {
      isSupported.value = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
      checkStatus()
    }
  })

  const checkStatus = async () => {
    if (!isSupported.value) return
    const registration = await navigator.serviceWorker.getRegistration()
    const subscription = await registration?.pushManager.getSubscription()
    isEnabled.value = !!subscription
  }

  const subscribe = async () => {
    if (!isSupported.value || loading.value) return
    loading.value = true

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Izin notifikasi ditolak')
      }

      const registration = await navigator.serviceWorker.ready
      
      // Get VAPID public key from server or env
      // For now, using a placeholder. In production, this should be in runtimeConfig
      const vapidPublicKey = 'BEl62i_E_0A-p26_8B8_J39D_5V_0_J_1_2_3_4_5_6_7_8_9_0' // Placeholder
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })

      // Send to server
      await $fetch('/api/auth/push-subscribe', {
        method: 'POST',
        body: subscription
      })

      isEnabled.value = true
      return true
    } catch (err: any) {
      console.error('Push Subscribe Error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const unsubscribe = async () => {
    if (!isSupported.value || loading.value) return
    loading.value = true

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        // Optional: Notify server
      }
      isEnabled.value = false
      return true
    } catch (err) {
      console.error('Push Unsubscribe Error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    isSupported,
    isEnabled,
    loading,
    subscribe,
    unsubscribe
  }
}

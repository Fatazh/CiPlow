// composables/usePush.ts
// Push & PWA Notification Composable

export function usePush() {
  const isSupported = ref(false)
  const isEnabled = ref(false)
  const permissionState = ref<'default' | 'granted' | 'denied'>('default')
  const loading = ref(false)

  onMounted(() => {
    if (import.meta.client) {
      isSupported.value = 'Notification' in window
      if (isSupported.value) {
        permissionState.value = Notification.permission
      }
      checkStatus()
    }
  })

  const checkStatus = async () => {
    if (!import.meta.client || !('Notification' in window)) return
    
    permissionState.value = Notification.permission
    const savedPreference = localStorage.getItem('ciplow_notifications_enabled')

    if (Notification.permission === 'granted') {
      isEnabled.value = savedPreference !== 'false'
    } else {
      isEnabled.value = false
    }
  }

  const sendTestNotification = async () => {
    if (!import.meta.client || !('Notification' in window)) return false
    if (Notification.permission !== 'granted') return false

    const title = 'CashPlow Budget Tracker 🔔'
    const options = {
      body: 'Notifikasi berhasil diaktifkan di smartphone Anda!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'ciplow-welcome-alert',
      renotify: true,
      vibrate: [100, 50, 100],
      data: { url: '/' }
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        if (registration && registration.showNotification) {
          await registration.showNotification(title, options)
          return true
        }
      }
      // Fallback
      new Notification(title, options)
      return true
    } catch (err) {
      console.warn('Service worker notification failed, using native Notification fallback', err)
      try {
        new Notification(title, options)
        return true
      } catch {
        return false
      }
    }
  }

  const subscribe = async () => {
    if (!import.meta.client || !('Notification' in window)) return false
    loading.value = true

    try {
      const permission = await Notification.requestPermission()
      permissionState.value = permission

      if (permission !== 'granted') {
        isEnabled.value = false
        localStorage.setItem('ciplow_notifications_enabled', 'false')
        return false
      }

      isEnabled.value = true
      localStorage.setItem('ciplow_notifications_enabled', 'true')

      // Attempt background Web Push registration if available
      try {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready
          const existingSub = await registration.pushManager.getSubscription()
          if (!existingSub) {
            // Optional: Register push subscription if VAPID server is ready
          }
        }
      } catch (pushErr) {
        console.warn('Background push subscription skipped:', pushErr)
      }

      // Trigger test notification
      await sendTestNotification()
      return true
    } catch (err: any) {
      console.error('Notification Subscribe Error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const unsubscribe = async () => {
    if (!import.meta.client) return false
    loading.value = true

    try {
      isEnabled.value = false
      localStorage.setItem('ciplow_notifications_enabled', 'false')

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration()
        const subscription = await registration?.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
        }
      }
      return true
    } catch (err) {
      console.error('Notification Unsubscribe Error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    isSupported,
    isEnabled,
    permissionState,
    loading,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkStatus,
  }
}

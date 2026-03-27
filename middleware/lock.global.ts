// middleware/lock.global.ts
// Global middleware to handle App Lock (PIN)

export default defineNuxtRouteMiddleware((to) => {
  const store = useUserStore()
  
  // Skip logic if app has no PIN set OR if already on the lock page
  if (!store.hasPin || to.path === '/lock') {
    return
  }

  // Check if app should auto-lock due to inactivity (if client-side)
  if (import.meta.client) {
    store.checkAutoLock()
  }

  // If locked, redirect to lock screen
  if (store.isLocked) {
    return navigateTo('/lock')
  }

  // Update activity timestamp on every navigation
  if (import.meta.client) {
    store.updateActivity()
  }
})

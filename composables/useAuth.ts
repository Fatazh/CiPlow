// composables/useAuth.ts
// Auth state management composable

interface UserStats {
  transactions: number
  categories: number
  wallets: number
  budgets: number
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  currency: string
  locale: string
  createdAt?: string | Date
  stats?: UserStats
}

export function useAuth() {
  const router = useRouter()

  const clearPrivateClientData = async () => {
    if (!import.meta.client) return

    if ('caches' in window) {
      await caches.delete('api-cache').catch(() => {})
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready.catch(() => null)
      registration?.active?.postMessage({ type: 'CLEAR_PRIVATE_CACHE' })
    }
  }

  // Use Nuxt's useState to prevent cross-request state pollution during SSR
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)
  const initialized = useState<boolean>('auth-initialized', () => false)

  // ── Fetch current user ─────────────────────────────────────
  const fetchUser = async () => {
    try {
      loading.value = true
      
      const headers = import.meta.server ? useRequestHeaders(['cookie']) as Record<string, string> : {}
      
      // We use $fetch and catch the error internally so it doesn't bubble up
      // and cause unhandled SSR exceptions (like 401 Belum login)
      const res = await $fetch<{ ok: boolean; data: User }>('/api/auth/me', {
        headers
      }).catch(() => null)
      
      if (res?.ok && res.data) {
        user.value = res.data
      } else {
        user.value = null
      }
    } catch {
      user.value = null
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  // ── Login ──────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const res = await $fetch<{ ok: boolean; data: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    user.value = res.data
    return res.data
  }

  // ── Register ───────────────────────────────────────────────
  const register = async (name: string, email: string, password: string) => {
    const res = await $fetch<{ ok: boolean; data: User }>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    })
    user.value = res.data
    return res.data
  }

  // ── Update Profile ──────────────────────────────────────────
  const updateUser = async (data: { name?: string; email?: string; avatar?: string; currency?: string }) => {
    try {
      const res = await $fetch<{ ok: boolean; data: User }>('/api/auth/me', {
        method: 'PUT',
        body: data,
      })
      if (res.data) {
        user.value = { ...user.value, ...res.data }
      }
      return res.data
    } catch (err) {
      throw err
    }
  }

  // ── Logout ─────────────────────────────────────────────────
  const logout = async () => {
    // 1. Call server to delete session cookie
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clearPrivateClientData()
    
    // 2. Clear local device PIN from store and localStorage for security
    if (import.meta.client) {
      const userStore = useUserStore()
      userStore.setPin('') // Reset PIN state
      userStore.isLocked = false
      localStorage.removeItem('ciplow_app_pin')
    }

    // 3. Reset local auth state
    user.value = null
    
    // 4. Redirect to login
    await router.push('/login')
  }

  // ── Computed ───────────────────────────────────────────────
  const isLoggedIn = computed(() => !!user.value)

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    isLoggedIn,
    fetchUser,
    login,
    register,
    logout,
    updateUser,
  }
}

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
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
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

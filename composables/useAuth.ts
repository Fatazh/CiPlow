// composables/useAuth.ts
// Auth state management composable

interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  currency: string
  locale: string
}

const user = ref<User | null>(null)
const loading = ref(true)
const initialized = ref(false)

export function useAuth() {
  const router = useRouter()

  // ── Fetch current user ─────────────────────────────────────
  const fetchUser = async () => {
    try {
      loading.value = true
      const res = await $fetch<{ ok: boolean; data: User }>('/api/auth/me')
      user.value = res.data
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
  }
}

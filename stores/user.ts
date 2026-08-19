export type AccentTheme = 'emerald' | 'ocean' | 'violet' | 'amber' | 'rose'

export const useUserStore = defineStore('user', () => {
  const { user, updateUser } = useAuth()
  
  // ── Currency State ──────────────────────────────────────────
  const _currency = ref('IDR')
  const locale = ref('id-ID')
  const currency = computed(() => user.value?.currency || _currency.value)

  // ── Privacy Mode (Hide/Mask Balance Globally) ───────────────
  const isBalanceHidden = ref(false)

  // ── Accent Color Theme ──────────────────────────────────────
  const accentTheme = ref<AccentTheme>('emerald')

  const applyAccentThemeClass = (theme: AccentTheme) => {
    if (!import.meta.client) return
    const root = document.documentElement
    root.classList.remove('theme-ocean', 'theme-violet', 'theme-amber', 'theme-rose')
    if (theme !== 'emerald') {
      root.classList.add(`theme-${theme}`)
    }
  }

  // Initial load
  if (import.meta.client) {
    const savedCurrency = localStorage.getItem('CashPlow-currency')
    if (savedCurrency) _currency.value = savedCurrency

    const savedHideBalance = localStorage.getItem('ciplow_hide_balance')
    if (savedHideBalance !== null) {
      isBalanceHidden.value = savedHideBalance === 'true'
    }

    const savedTheme = localStorage.getItem('ciplow_accent_theme') as AccentTheme | null
    if (savedTheme) {
      accentTheme.value = savedTheme
      applyAccentThemeClass(savedTheme)
    }
  }

  const setAccentTheme = (theme: AccentTheme) => {
    accentTheme.value = theme
    applyAccentThemeClass(theme)
    if (import.meta.client) {
      localStorage.setItem('ciplow_accent_theme', theme)
    }
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
    accentTheme,
    setAccentTheme,
    toggleBalanceHidden,
    setCurrency
  }
})

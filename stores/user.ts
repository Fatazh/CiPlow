export type AccentTheme = 'emerald' | 'ocean' | 'violet' | 'amber' | 'rose'

export interface AccentThemeInfo {
  id: AccentTheme
  name: string
  hex: string
  darkHex: string
  desc: string
}

export const ACCENT_THEMES: AccentThemeInfo[] = [
  { id: 'emerald', name: 'Emerald Green', hex: '#10b981', darkHex: '#059669', desc: 'Warna default CashPlow yang sejuk & profesional' },
  { id: 'ocean', name: 'Ocean Blue', hex: '#0ea5e9', darkHex: '#0284c7', desc: 'Biru laut modern dan bersih' },
  { id: 'violet', name: 'Royal Violet', hex: '#8b5cf6', darkHex: '#7c3aed', desc: 'Ungu elegan dan artistik' },
  { id: 'amber', name: 'Sunset Amber', hex: '#f59e0b', darkHex: '#d97706', desc: 'Kuning keemasan hangat & berenergi' },
  { id: 'rose', name: 'Rose Pink', hex: '#ec4899', darkHex: '#db2777', desc: 'Merah muda cerah dan menawan' },
]

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

  const currentThemeInfo = computed(() => {
    return ACCENT_THEMES.find(t => t.id === accentTheme.value) || ACCENT_THEMES[0]
  })

  const currentAccentHex = computed(() => currentThemeInfo.value.hex)

  const applyAccentThemeClass = (theme: AccentTheme) => {
    if (!import.meta.client) return
    const root = document.documentElement
    root.classList.remove('theme-emerald', 'theme-ocean', 'theme-violet', 'theme-amber', 'theme-rose')
    if (theme !== 'emerald') {
      root.classList.add(`theme-${theme}`)
    }
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const info = ACCENT_THEMES.find(t => t.id === theme) || ACCENT_THEMES[0]
      metaThemeColor.setAttribute('content', info.hex)
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
    currentThemeInfo,
    currentAccentHex,
    setAccentTheme,
    applyAccentThemeClass,
    toggleBalanceHidden,
    setCurrency
  }
})

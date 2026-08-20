import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './composables/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'rgb(var(--primary-50, 236 253 245) / <alpha-value>)',
          100: 'rgb(var(--primary-100, 209 250 229) / <alpha-value>)',
          200: 'rgb(var(--primary-200, 167 243 208) / <alpha-value>)',
          300: 'rgb(var(--primary-300, 110 231 183) / <alpha-value>)',
          400: 'rgb(var(--primary-400, 52 211 153) / <alpha-value>)',
          500: 'rgb(var(--primary-500, 16 185 129) / <alpha-value>)',
          600: 'rgb(var(--primary-600, 5 150 105) / <alpha-value>)',
          700: 'rgb(var(--primary-700, 4 120 87) / <alpha-value>)',
          800: 'rgb(var(--primary-800, 6 95 70) / <alpha-value>)',
          900: 'rgb(var(--primary-900, 6 78 59) / <alpha-value>)',
          950: 'rgb(var(--primary-950, 2 44 34) / <alpha-value>)',
        },
        income: {
          light: '#d1fae5',
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        expense: {
          light: '#ffe4e6',
          DEFAULT: '#f43f5e',
          dark: '#e11d48',
        },
        surface: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      screens: {
        xs: '375px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      maxWidth: {
        app: '540px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        card:   '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        fab:    '0 8px 24px -4px rgb(var(--primary-500, 16 185 129) / 0.55)',
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      backgroundImage: {
        'gradient-primary':     'linear-gradient(135deg, rgb(var(--primary-500, 16 185 129)) 0%, rgb(var(--primary-600, 5 150 105)) 100%)',
        'gradient-primary-dark':'linear-gradient(135deg, rgb(var(--primary-600, 5 150 105)) 0%, rgb(var(--primary-800, 6 95 70)) 100%)',
        'gradient-income':      'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        'gradient-expense':     'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)',
        'gradient-card-dark':   'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-in':   'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'nav-height':  '4.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config

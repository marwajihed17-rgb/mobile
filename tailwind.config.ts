import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4A90F5',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          DEFAULT: '#C74AFF',
          light: '#d879ff',
          dark: '#a33dd6',
        },
        background: {
          DEFAULT: '#0a0e1a',
          secondary: '#0d1117',
        },
        card: {
          DEFAULT: '#1a1f2e',
          hover: '#242938',
          border: '#2a3144',
          'border-hover': '#3a4154',
        },
        foreground: {
          DEFAULT: '#fafafa',
          secondary: '#e5e7eb',
        },
        muted: {
          DEFAULT: '#71717a',
          light: '#9ca3af',
        },
        success: {
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        error: {
          DEFAULT: '#ef4444',
          dark: '#dc2626',
        },
        warning: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        info: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
      },
      fontFamily: {
        // Arabic-optimized font stack with proper fallbacks
        sans: [
          'Tajawal',           // Modern Arabic font
          'Cairo',             // Alternative Arabic font
          'Inter',             // Latin fallback
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Noto Sans Arabic', // Google's Arabic support
          'sans-serif',
        ],
        arabic: [
          'Tajawal',
          'Cairo',
          'Noto Sans Arabic',
          'Arial',
          'sans-serif',
        ],
      },
      // RTL-aware spacing using logical properties
      spacing: {
        'start-1': 'var(--space-1)',
        'start-2': 'var(--space-2)',
        'start-3': 'var(--space-3)',
        'start-4': 'var(--space-4)',
        'end-1': 'var(--space-1)',
        'end-2': 'var(--space-2)',
        'end-3': 'var(--space-3)',
        'end-4': 'var(--space-4)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.125rem',
      },
      boxShadow: {
        'primary': '0 10px 25px -5px rgba(74, 144, 245, 0.2)',
        'primary-lg': '0 20px 40px -10px rgba(74, 144, 245, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'pulse-slow': 'pulseSlow 6s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.1', transform: 'scale(1)' },
          '50%': { opacity: '0.15', transform: 'scale(1.05)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config

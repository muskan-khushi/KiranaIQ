/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background: '#F8F7F4',
        surface: '#FFFFFF',
        'surface-2': '#F2F1EE',
        primary: '#0D0D0D',
        secondary: '#3D3D3D',
        muted: '#7A7670',
        border: '#E4E2DD',
        'border-strong': '#C8C5BD',
        // Brand accent
        accent: '#FF6B35',
        'accent-light': '#FFF0EB',
        'accent-dark': '#E55A26',
        // Semantic
        success: '#1A7A4A',
        'success-light': '#ECFDF3',
        warning: '#B45309',
        'warning-light': '#FFFBEB',
        danger: '#DC2626',
        'danger-light': '#FEF2F2',
        // Data viz
        'chart-1': '#FF6B35',
        'chart-2': '#1A7A4A',
        'chart-3': '#2563EB',
        'chart-4': '#7C3AED',
        'chart-5': '#B45309',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'elevated': '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)',
        'glow-accent': '0 0 20px rgba(255, 107, 53, 0.25)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'slide-in-right': 'slideInRight 0.35s ease-out forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'progress': 'progressFill 1.5s ease-out forwards',
        'count-up': 'countUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"General Sans"', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Clash Display"', '"DM Serif Display"', 'Georgia', 'serif'],
        serif:   ['"DM Serif Display"', 'Georgia', 'serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        background:   '#F9F7F3',
        surface:      '#FFFFFF',
        'surface-2':  '#F4F2ED',
        primary:      '#111008',
        secondary:    '#3A3830',
        muted:        '#7A7567',
        border:       '#E8E3DA',
        'border-2':   '#D4CEC4',

        accent:        '#E8570A',
        'accent-light':'#FEF3EE',
        'accent-dark': '#C44807',

        success:        '#14683D',
        'success-light':'#EDF7F2',
        warning:        '#9A5B0D',
        'warning-light':'#FEF9ED',
        danger:         '#C62828',
        'danger-light': '#FEF2F2',

        'chart-1': '#E8570A',
        'chart-2': '#14683D',
        'chart-3': '#1B65B8',
        'chart-4': '#6D3AB5',
        'chart-5': '#9A5B0D',
      },
      boxShadow: {
        'card':        '0 1px 2px rgba(17,16,8,0.04), 0 2px 8px rgba(17,16,8,0.04)',
        'card-hover':  '0 4px 16px rgba(17,16,8,0.08), 0 1px 4px rgba(17,16,8,0.04)',
        'elevated':    '0 8px 28px rgba(17,16,8,0.10), 0 2px 8px rgba(17,16,8,0.06)',
        'glow-accent': '0 0 0 3px rgba(232,87,10,0.18)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out forwards',
        'slide-up':      'slideUp 0.4s ease-out forwards',
        'scale-in':      'scaleIn 0.3s ease-out forwards',
        'pulse-slow':    'pulse 3s ease-in-out infinite',
        'shimmer':       'shimmer 1.6s ease-in-out infinite',
        'spin-slow':     'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}
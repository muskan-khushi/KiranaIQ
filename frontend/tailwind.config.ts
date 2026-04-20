/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA', // Ultra-light gray, softer than pure white
        surface: '#FFFFFF',
        primary: '#0F172A', // Slate 900 for sharp, high-contrast text
        muted: '#64748B', // Slate 500 for secondary text
        border: '#E2E8F0', // Slate 200 for subtle borders
        // Semantic colors for the Dashboard
        success: '#10B981', // Emerald for 'Approve'
        warning: '#F59E0B', // Amber for 'Needs Verification'
        danger: '#EF4444', // Red for 'Reject'
      },
      boxShadow: {
        'aesthetic': '0 4px 20px -2px rgba(0, 0, 0, 0.05)', // Very soft, modern shadow
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#1e293b',
          900: '#0f172a',
          950: '#0a0f1d',
        },
        brand: {
          teal: '#0d9488',
          'teal-dark': '#0f766e',
          'teal-light': '#ccfbf1',
          blue: '#0284c7',
          'blue-dark': '#0369a1',
          'blue-light': '#e0f2fe',
        },
        urgency: {
          high: '#dc2626',
          'high-bg': '#fef2f2',
          'high-border': '#fecaca',
          med: '#d97706',
          'med-bg': '#fffbeb',
          'med-border': '#fde68a',
          low: '#16a34a',
          'low-bg': '#f0fdf4',
          'low-border': '#bbf7d0',
          unknown: '#64748b',
          'unknown-bg': '#f8fafc',
          'unknown-border': '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matrix-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        'cyber-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        'protein-green': '#22c55e',
        'carbs-blue': '#3b82f6',
        'fat-orange': '#f97316',
        'fiber-purple': '#a855f7',
      },
      backgroundColor: {
        'dark-primary': '#0a0a0a',
        'dark-secondary': '#171717',
        'dark-card': '#1a1a1a',
      },
      textColor: {
        'dark-primary': '#ffffff',
        'dark-secondary': '#a3a3a3',
      },
      borderColor: {
        'dark': '#262626',
      },
    },
  },
  plugins: [],
}
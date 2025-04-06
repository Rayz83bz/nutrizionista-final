/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    { pattern: /bg-palette_.+-bg/ },
    { pattern: /text-palette_.+-text/ },
    { pattern: /text-palette_.+-accent/ },
    { pattern: /border-palette_.+-border/ },
    { pattern: /hover:bg-palette_.+-hover/ },
  ],
  theme: {
    extend: {
      colors: {
        // Palette base (esistente)
        primary: '#3B82F6',
        secondary: '#60A5FA',
        light: '#F9FAFB',
        dark: '#1F2937',

        // Palette selezionabili
        palette_default: {
          bg: '#ffffff',
          text: '#1f2937',
          accent: '#3b82f6',
          border: '#e5e7eb',
          hover: '#eff6ff',
        },
        palette_elegant: {
          bg: '#f5f5f7',
          text: '#2c2c2e',
          accent: '#14532d',
          border: '#e5e7eb',
          hover: '#e6f0ea',
        },
        palette_dark: {
          bg: '#1f1f1f',
          text: '#e5e5e5',
          accent: '#10b981',
          border: '#374151',
          hover: '#111827',
        },
        palette_softgray: {
          bg: '#f0f0f0',
          text: '#2d2d2d',
          accent: '#6366f1',
          border: '#d4d4d8',
          hover: '#e4e4e7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

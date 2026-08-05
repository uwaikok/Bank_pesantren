/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main: Hijau Tosca / Emerald Tua
        emerald: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5de4c7',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488', // Primary Tosca
          700: '#0f766e', // Deep Emerald/Tosca
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Accent: Emas / Gold Muda
        gold: {
          50: '#fdfbeb',
          100: '#fcf6cd',
          200: '#f7e693',
          300: '#f2d154',
          400: '#eab822',
          500: '#d49b10', // Main Gold Accent
          600: '#b4770c',
          700: '#91560c',
          800: '#77430e',
          900: '#63360f',
          950: '#3b2306',
        },
        // Neutral: Clean slate grays for light mode
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        pesantren: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5de4c7',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
    },
  },
  plugins: [],
}

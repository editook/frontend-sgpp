/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6', // Violeta referencial (ProTend - IDIF)
          600: '#7c3aed',
          900: '#4c1d95',
        },
        secondary: {
          500: '#10b981', // Verde referencial
          600: '#059669',
        }
      }
    },
  },
  plugins: [],
}

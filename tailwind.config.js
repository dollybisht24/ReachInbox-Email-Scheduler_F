/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#0f172a',
          600: '#020617',
          accent: '#2563eb',
          accentHover: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}

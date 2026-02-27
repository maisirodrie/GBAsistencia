/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gb: {
          blue: '#1e3a8a',
          red: '#dc2626',
          dark: '#111827'
        }
      }
    },
  },
  plugins: [],
}

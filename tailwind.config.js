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
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
        },
        steel: {
          500: '#64748b',
          400: '#94a3b8',
        },
        gold: {
          500: '#eab308',
          600: '#ca8a04',
          400: '#fde047',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        title: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

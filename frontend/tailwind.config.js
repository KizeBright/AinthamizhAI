/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          hover: '#D97706',
        },
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          50: '#eefcf4',
          100: '#d7f7e4',
          500: '#25D366',
          600: '#128C7E',
          700: '#075E54',
          800: '#05463f',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FDFAF4',   // navbar-bg
          100: '#F5F0E8',  // bg-primary
          200: '#EDE8DC',  // bg-secondary
          300: '#D4CFC4',  // border
        },
        accent: {
          green: '#4CAF78',
        },
        dark: {
          card: '#2C2C2C', // bg-dark-card
          text: '#1A1A1A', // text-primary
          muted: '#6B6560', // text-secondary
        }
      }
    },
  },
  plugins: [],
}

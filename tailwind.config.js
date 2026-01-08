/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        nature: { 50: '#f2fbf5', 100: '#e0f7e9', 200: '#c3ecd3', 300: '#95dab3', 400: '#5fc08d', 500: '#3ba573', 600: '#2b865b', 700: '#266b4b', 800: '#22553e', 900: '#1d4634' },
        earth: { 50: '#fbf7f3', 100: '#f5ebe1', 800: '#5e4b35', 900: '#4d3d2b' }
      },
      fontFamily: { sans: ['Inter', 'sans-serif'], serif: ['Merriweather', 'serif'] },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      }
    }
  },
  plugins: [],
}
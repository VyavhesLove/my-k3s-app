/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'spin-slow': 'spin 5s linear infinite',
        'wrench-rotate': 'wrench-rotate 1.5s ease-in-out infinite alternate',
        'wrench-tighten': 'wrench-tighten 0.8s ease-in-out infinite alternate',
      },
      keyframes: {
        'spin-slow': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'wrench-rotate': {
          '0%, 100%': { transform: 'rotate(-10deg)' },
          '50%': { transform: 'rotate(10deg)' },
        },
        'wrench-tighten': {
          '0%': { transform: 'rotate(-30deg) translateX(-10px)' },
          '100%': { transform: 'rotate(30deg) translateX(10px)' },
        },
      },
    },
  },
  plugins: [],
}


/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'fade-in': 'fadeIn 0.5s ease-in',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0) rotate(0deg)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-8px) rotate(-2deg)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(8px) rotate(2deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3) translateY(-50px)' },
          '50%': { opacity: '1', transform: 'scale(1.05) translateY(0)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#667eea',
          600: '#5a6fd8',
          700: '#4f46e5'
        },
        secondary: {
          500: '#764ba2',
          600: '#6b4190'
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        dopamine: {
          400: '#ffd700',
          500: '#ffed4e'
        }
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-fast': 'pulse 1s infinite',
        'xp-gain': 'xpGain 1s ease-out forwards'
      },
      keyframes: {
        xpGain: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-30px) scale(1.2)', opacity: '0' }
        }
      }
    },
  },
  plugins: [],
}
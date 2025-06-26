/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            p: {
              marginTop: '0',
              marginBottom: '0',
            },
          },
        },
      },
      animation: {
        'fade-in-out': 'fadeInOut 3s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInOut: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '10%': { opacity: 1, transform: 'translateY(0)' },
          '90%': { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
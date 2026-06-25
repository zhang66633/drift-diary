/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          light: '#faf4e4',
          DEFAULT: '#f4ecd8',
          dark: '#e8dcc0',
        },
        ink: {
          light: '#5a4635',
          DEFAULT: '#2a1f14',
          dark: '#1a1008',
        },
        wax: {
          DEFAULT: '#7a5a30',
          dark: '#5a4220',
        },
        ember: {
          light: '#d4a05a',
          DEFAULT: '#b8762e',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"Songti SC"', 'serif'],
      },
      boxShadow: {
        'page-inset': 'inset 0 0 120px rgba(80, 50, 20, 0.12)',
        'candle': '0 0 40px rgba(216, 160, 90, 0.1)',
      },
    },
  },
  plugins: [],
}

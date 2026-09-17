/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        xcyan: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7'
        },
        xgreen: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a'
        },
        xdark: {
          900: '#0b0f17',
          800: '#131b29',
          700: '#1e293b'
        }
      }
    },
  },
  plugins: [],
};

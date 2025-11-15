/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0A0A0A',
          sidebar: '#1A1A1A',
          card: '#2A2A2A',
          border: '#3A3A3A',
          hover: '#2F2F2F',
        },
        grid: {
          dot: '#3E3E3E',
        },
      },
    },
  },
  plugins: [],
}

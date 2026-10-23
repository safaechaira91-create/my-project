/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'brand-green': '#10b981',
        'brand-green-dark': '#059669',
        'brand-orange': '#E17E24',
      },
    },
  },
  plugins: [],
}
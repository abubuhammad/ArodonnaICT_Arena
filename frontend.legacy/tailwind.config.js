/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable class-based dark mode so toggling the `dark` class works at runtime
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

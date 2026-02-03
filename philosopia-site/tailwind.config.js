/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // "The Scholar" layer: Playfair (En) -> Frank Ruhl (He)
        serif: ['"Playfair Display"', '"Frank Ruhl Libre"', 'serif'],

        // "The Architect" layer: Inter (En) -> Heebo (He)
        sans: ['"Inter"', '"Heebo"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

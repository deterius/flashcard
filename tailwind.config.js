/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",      // Points to index.html in the root directory
    "./js/index.js",
    "./js/functionUI.js",
    "./**/*.html",
 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


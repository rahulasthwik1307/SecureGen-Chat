/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        popYellow: "#FFDE59",
        popBlue: "#2E5BFF",
        popPink: "#FF5470",
        popMint: "#00E599",
        popOrange: "#FF8A00",
        popPurple: "#9D4EDD",
        popCream: "#FFFDF6",
        popDark: "#111111",
        popSurface: "#1A1A1A",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fredoka"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Space Grotesk"', 'monospace'],
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px #000000',
        'neo': '4px 4px 0px #000000',
        'neo-lg': '6px 6px 0px #000000',
        'neo-xl': '8px 8px 0px #000000',
        'neo-pink': '4px 4px 0px #FF5470',
        'neo-yellow': '4px 4px 0px #FFDE59',
        'neo-white': '4px 4px 0px #FFFFFF',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}

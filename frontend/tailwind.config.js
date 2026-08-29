/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Indigo vat & threshing floor" palette — deliberately not the
        // cream/terracotta or near-black/neon defaults. Grounded in indigo-dye
        // textile tradition (deep teal-indigo) with turmeric/mustard and
        // terracotta as functional accents, and a paddy-green for positive states.
        ink: {
          950: "#0F1E22",
          900: "#16262B",
          800: "#1E3339",
          700: "#28454C",
          600: "#3A5E64"
        },
        paper: {
          100: "#F7F1E1",
          200: "#EDE3CC",
          300: "#DED0AE"
        },
        turmeric: {
          400: "#E8B646",
          500: "#D9A441",
          600: "#BD8A2E"
        },
        terracotta: {
          400: "#D97E52",
          500: "#C1622D",
          600: "#A54F22"
        },
        paddy: {
          400: "#95B872",
          500: "#7FA65A",
          600: "#658A43"
        }
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Manrope", "sans-serif"]
      },
      backgroundImage: {
        "stitch-line":
          "repeating-linear-gradient(90deg, transparent, transparent 6px, currentColor 6px, currentColor 8px)"
      }
    }
  },
  plugins: []
};

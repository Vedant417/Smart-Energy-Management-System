/** @type {import('tailwindcss').Config} */
export default {
  content:   ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode:  "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        accent: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
        },
        dark: {
          900: "#0a0f1a",
          800: "#0f172a",
          700: "#1e293b",
          600: "#334155",
          500: "#475569",
        },
      },
      animation: {
        "pulse-slow":  "pulse 3s ease-in-out infinite",
        "float":       "float 3s ease-in-out infinite",
        "glow":        "glow 2s ease-in-out infinite alternate",
        "slide-up":    "slideUp 0.4s ease-out",
        "fade-in":     "fadeIn 0.3s ease-out",
      },
      keyframes: {
        float:   { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        glow:    { from: { boxShadow: "0 0 10px #22c55e40" }, to: { boxShadow: "0 0 30px #22c55e80, 0 0 60px #22c55e30" } },
        slideUp: { from: { transform: "translateY(20px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        "glow-green": "0 0 20px rgba(34,197,94,0.3)",
        "glow-blue":  "0 0 20px rgba(99,102,241,0.3)",
        "glow-red":   "0 0 20px rgba(239,68,68,0.3)",
        "card":       "0 4px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

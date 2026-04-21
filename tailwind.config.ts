import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
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
        ink:    "#0f172a",
        paper:  "#ffffff",
        accent: "#d97706",
        danger: "#991b1b",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15,23,42,0.10)",
        card: "0 1px 3px rgba(15,23,42,0.08)",
      },
      borderRadius: {
        app: "16px",
        "app-lg": "20px",
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};

export default config;

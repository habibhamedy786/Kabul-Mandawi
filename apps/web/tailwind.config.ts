import type { Config } from "tailwindcss";

// Brand palette: Green / White / Dark Gray, per the spec's UI requirements.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eafaf0",
          100: "#cdf2dc",
          200: "#9be5bb",
          300: "#65d398",
          400: "#34bd78",
          500: "#16a35c",
          600: "#0f8a4c",
          700: "#0d6e3f",
          800: "#0c5735",
          900: "#0a472d",
        },
        ink: {
          50: "#f6f7f8",
          100: "#eceef0",
          200: "#d5d9de",
          300: "#b1b9c1",
          400: "#86919c",
          500: "#677380",
          600: "#525c68",
          700: "#434b55",
          800: "#2e333a",
          900: "#1c1f24",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;

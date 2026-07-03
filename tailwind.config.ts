import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // The Crude Oracle palette — dark professional terminal
        ink: {
          950: "#07090c", // page background (near-black)
          900: "#0b0e13", // panel background
          850: "#10141b", // card background
          800: "#161b24", // raised card
          700: "#212936", // borders / dividers
          600: "#2e3948",
        },
        navy: {
          900: "#0a1526",
          800: "#0f1f38",
          700: "#16294a",
        },
        steel: {
          500: "#8b98a9", // secondary text
          400: "#a6b1c0",
          300: "#c3ccd8",
        },
        gold: {
          600: "#a8842c",
          500: "#c9a038", // crude oil gold — primary accent
          400: "#dcb54e",
          300: "#e9cd7e",
        },
        gain: "#2ecc71", // positive market moves
        loss: "#e74c3c", // negative market moves
        risk: "#f0a92e", // amber risk alerts
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      maxWidth: {
        "8xl": "88rem",
      },
    },
  },
  plugins: [],
};

export default config;

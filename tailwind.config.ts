import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f5fb",
          100: "#dbe7f4",
          200: "#b9d1e9",
          300: "#8bb3d9",
          400: "#578dc3",
          500: "#3570aa",
          600: "#27578c",
          700: "#224872",
          800: "#203d5f",
          900: "#1e3450",
          950: "#132133",
        },
      },
      fontFamily: {
        sans: ["Segoe UI", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.06), 0 1px 3px 0 rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

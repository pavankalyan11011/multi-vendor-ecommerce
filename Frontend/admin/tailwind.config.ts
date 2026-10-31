import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        emporia: {
          ink: "#0B1F1C",
          "ink-soft": "#163532",
          mist: "#E4EDEC",
          paper: "#F2F6F5",
          teal: "#0F766E",
          "teal-bright": "#2DD4BF",
          lime: "#D9F99D",
          muted: "#5B736F",
          border: "#C5D4D1",
          danger: "#B91C1C",
          success: "#047857",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        emporia: "0 1px 0 rgba(11, 31, 28, 0.04), 0 18px 40px -24px rgba(11, 31, 28, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;

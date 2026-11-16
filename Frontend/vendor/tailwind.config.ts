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
          ink: "#102B28",
          "ink-soft": "#172B28",
          mist: "#EEF3F1",
          paper: "#F8FAF9",
          teal: "#087F73",
          "teal-bright": "#0D9A8C",
          lime: "#D9F99D",
          gold: "#C8A76A",
          muted: "#64748B",
          border: "#E5EAE8",
          danger: "#B91C1C",
          success: "#047857",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        emporia:
          "0 1px 0 rgba(16, 43, 40, 0.04), 0 12px 32px -20px rgba(16, 43, 40, 0.28)",
      },
    },
  },
  plugins: [],
} satisfies Config;

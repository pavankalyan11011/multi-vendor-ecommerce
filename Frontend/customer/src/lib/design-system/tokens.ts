/**
 * Emporia design tokens — ink teal commerce, cool mist surfaces, lime spark.
 * Map into CSS variables in globals.css; prefer Tailwind `emporia.*` utilities.
 */
export const tokens = {
  color: {
    ink: "#0B1F1C",
    inkSoft: "#163532",
    mist: "#E4EDEC",
    paper: "#F2F6F5",
    white: "#FFFFFF",
    teal: "#0F766E",
    tealBright: "#2DD4BF",
    lime: "#D9F99D",
    danger: "#B91C1C",
    dangerSoft: "#FEF2F2",
    success: "#047857",
    successSoft: "#ECFDF5",
    muted: "#5B736F",
    border: "#C5D4D1",
  },
  radius: {
    sm: "0.375rem",
    md: "0.625rem",
    lg: "1rem",
  },
  space: {
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    6: "1.5rem",
    8: "2rem",
    12: "3rem",
  },
  font: {
    display: "var(--font-display)",
    sans: "var(--font-sans)",
  },
  control: {
    height: "2.75rem",
  },
  motion: {
    fadeUp: "emporia-fade-up 0.75s cubic-bezier(0.22, 1, 0.36, 1) both",
    ken: "emporia-ken 20s ease-out forwards",
  },
} as const;

/**
 * Emporia Seller design tokens — charcoal, teal accent, warm-neutral surfaces.
 */
export const tokens = {
  color: {
    ink: "#102B28",
    inkSoft: "#172B28",
    mist: "#EEF3F1",
    paper: "#F8FAF9",
    white: "#FFFFFF",
    teal: "#087F73",
    tealBright: "#0D9A8C",
    lime: "#D9F99D",
    gold: "#C8A76A",
    danger: "#B91C1C",
    dangerSoft: "#FEF2F2",
    success: "#047857",
    successSoft: "#ECFDF5",
    muted: "#64748B",
    border: "#E5EAE8",
  },
  radius: {
    sm: "0.375rem",
    md: "0.75rem",
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
} as const;

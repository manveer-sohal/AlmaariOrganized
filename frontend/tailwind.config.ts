import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        almaari: {
          bg: "var(--almaari-bg)",
          surface: "var(--almaari-surface)",
          "surface-raised": "var(--almaari-surface-raised)",
          ink: "var(--almaari-ink)",
          muted: "var(--almaari-muted)",
          accent: "var(--almaari-accent)",
          "accent-soft": "var(--almaari-accent-soft)",
          "accent-strong": "var(--almaari-accent-strong)",
          border: "var(--almaari-border)",
          chrome: "var(--almaari-chrome)",
          warm: "var(--almaari-warm)",
        },
      },
      borderRadius: {
        almaari: "var(--almaari-radius)",
        "almaari-lg": "var(--almaari-radius-lg)",
      },
      fontFamily: {
        display: ["var(--font-almaari-display)", "Georgia", "serif"],
        sans: ["var(--font-almaari-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px rgba(39, 49, 87, 0.08)",
        card: "0 2px 12px rgba(39, 49, 87, 0.06)",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        content: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
        input: "var(--input)",
        "input-border": "var(--input-border)",
        primary: "var(--primary)",
        "primary-text": "var(--primary-text)",
        danger: "var(--danger)",
        success: "var(--success)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        sunken: "var(--sunken)",
        ink: "var(--text)",
        "ink-soft": "var(--text-soft)",
        "ink-faint": "var(--text-faint)",
        accent: "var(--accent-2)",
        "accent-1": "var(--accent-1)",
        "accent-3": "var(--accent-3)",
      },
      borderRadius: {
        card: "24px",
        "card-lg": "32px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
      fontFamily: {
        display: ["Quicksand", "Nunito", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

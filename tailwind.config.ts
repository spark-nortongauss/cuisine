import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        success: "hsl(var(--success))",
        "success-foreground": "hsl(var(--success-foreground))",
        warning: "hsl(var(--warning))",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.35rem",
        "3xl": "1.8rem",
      },
      boxShadow: {
        luxe: "0 28px 60px -34px rgba(24, 16, 9, 0.72)",
        glow: "0 0 0 1px rgba(234, 194, 116, 0.38), 0 26px 58px -32px rgba(24, 120, 96, 0.58)",
        soft: "0 18px 36px -30px rgba(18, 10, 8, 0.95)",
      },
      backgroundImage: {
        "premium-surface": "linear-gradient(155deg, hsl(24 22% 18% / 0.84), hsl(18 20% 11% / 0.86) 45%, hsl(30 18% 13% / 0.9))",
      },
    },
  },
  plugins: [],
};

export default config;

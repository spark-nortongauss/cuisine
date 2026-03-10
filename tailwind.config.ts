import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "Playfair Display", "ui-serif", "Georgia", "serif"],
      },
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
        info: "hsl(var(--info))",
        wine: "hsl(var(--wine))",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.35rem",
        "3xl": "1.8rem",
      },
      boxShadow: {
        luxe: "0 22px 50px -30px rgba(18, 18, 18, 0.7)",
        glow: "0 0 0 1px rgba(212, 169, 79, 0.34), 0 24px 52px -28px rgba(66, 47, 18, 0.46)",
        soft: "0 16px 34px -26px rgba(18, 18, 18, 0.58)",
      },
      backgroundImage: {
        "premium-surface": "linear-gradient(135deg, hsl(38 36% 96%), hsl(40 31% 94%))",
        "premium-surface-soft": "linear-gradient(180deg, hsl(40 38% 96%), hsl(37 30% 94%))",
        "premium-panel": "linear-gradient(145deg, rgba(248, 245, 240, 0.98), rgba(245, 242, 236, 0.92))",
        "hero-luxury": "linear-gradient(135deg, #1A1A1A 0%, #2C2620 100%)",
        "accent-luxury": "linear-gradient(135deg, #D4A94F 0%, #E5C07B 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

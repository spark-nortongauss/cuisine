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
        luxe: "0 38px 88px -42px rgba(2, 6, 23, 0.88)",
        glow: "0 0 0 1px rgba(232, 194, 117, 0.22), 0 28px 72px -34px rgba(5, 10, 24, 0.92), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        soft: "0 18px 46px -28px rgba(4, 8, 20, 0.68)",
        floating: "0 22px 46px -26px rgba(5, 10, 24, 0.72)",
      },
      backgroundImage: {
        "premium-surface": "linear-gradient(145deg, rgba(21, 28, 43, 0.96) 0%, rgba(11, 16, 29, 0.94) 100%)",
        "premium-surface-soft": "linear-gradient(180deg, rgba(28, 36, 53, 0.94) 0%, rgba(18, 24, 37, 0.94) 100%)",
        "premium-panel": "linear-gradient(180deg, rgba(20, 27, 40, 0.96) 0%, rgba(12, 17, 29, 0.94) 100%)",
        "hero-luxury": "radial-gradient(circle at top left, rgba(232, 194, 117, 0.16), transparent 28%), radial-gradient(circle at 82% 18%, rgba(99, 179, 237, 0.12), transparent 24%), linear-gradient(135deg, rgba(20, 27, 40, 0.98) 0%, rgba(11, 16, 29, 0.97) 58%, rgba(22, 35, 58, 0.96) 100%)",
        "accent-luxury": "linear-gradient(135deg, rgba(232, 194, 117, 0.96) 0%, rgba(244, 220, 173, 0.94) 100%)",
        "glass-luxury": "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

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
        luxe: "0 14px 40px -24px rgba(57, 40, 21, 0.55)",
        glow: "0 0 0 1px rgba(188, 148, 90, 0.35), 0 20px 44px -24px rgba(178, 138, 79, 0.75)",
      },
    },
  },
  plugins: [],
};

export default config;

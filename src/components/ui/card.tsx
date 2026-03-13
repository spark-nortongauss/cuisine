import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-3xl border p-5 md:p-6", {
  variants: {
    variant: {
      default: "border-white/10 bg-premium-panel text-card-foreground shadow-soft backdrop-blur-xl",
      glass: "border-white/12 bg-white/[0.05] text-card-foreground shadow-luxe backdrop-blur-2xl",
      feature:
        "border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(232,194,117,0.14),transparent_28%),linear-gradient(180deg,rgba(28,36,53,0.97),rgba(12,17,29,0.95))] text-card-foreground shadow-glow",
      muted: "border-white/8 bg-premium-surface-soft text-card-foreground shadow-soft",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

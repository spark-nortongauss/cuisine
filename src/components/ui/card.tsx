import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-3xl border p-5 md:p-6", {
  variants: {
    variant: {
      default: "border-border/80 bg-premium-surface text-card-foreground shadow-soft",
      glass: "border-primary/20 bg-card/70 text-card-foreground shadow-luxe backdrop-blur-xl",
      feature: "border-primary/30 bg-gradient-to-br from-card via-card to-muted/35 text-card-foreground shadow-glow",
      muted: "border-border/70 bg-muted/40 text-card-foreground",
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

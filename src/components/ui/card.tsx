import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-3xl border p-5 md:p-6", {
  variants: {
    variant: {
      default: "border-border/80 bg-premium-surface text-card-foreground shadow-soft",
      glass: "border-primary/35 bg-card/95 text-card-foreground shadow-luxe backdrop-blur-xl",
      feature: "border-primary/35 bg-gradient-to-br from-card via-card to-muted text-card-foreground shadow-glow",
      muted: "border-border/80 bg-muted/85 text-card-foreground",
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

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.08em] uppercase", {
  variants: {
    variant: {
      default: "border-border bg-muted/70 text-card-foreground",
      accent: "border-accent/70 bg-accent/80 text-accent-foreground",
      success: "border-success/40 bg-success/15 text-success",
      warning: "border-warning/45 bg-warning/20 text-warning",
      danger: "border-destructive/40 bg-destructive/15 text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

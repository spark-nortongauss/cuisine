import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "border-border/70 bg-muted/65 text-muted-foreground",
      accent: "border-primary/30 bg-primary/10 text-primary",
      success: "border-success/35 bg-success/15 text-success",
      warning: "border-warning/35 bg-warning/20 text-warning",
      danger: "border-destructive/35 bg-destructive/15 text-destructive",
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

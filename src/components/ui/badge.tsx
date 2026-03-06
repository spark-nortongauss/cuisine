import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-muted text-muted-foreground",
      accent: "bg-accent/40 text-foreground",
      success: "bg-success/15 text-success",
      warning: "bg-warning/20 text-foreground",
      danger: "bg-destructive/15 text-destructive",
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

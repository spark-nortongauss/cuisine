import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase", {
  variants: {
    variant: {
      default: "border-white/10 bg-white/[0.05] text-card-foreground",
      accent: "border-primary/25 bg-primary/15 text-primary",
      success: "border-success/40 bg-success/15 text-success",
      warning: "border-warning/40 bg-warning/15 text-warning",
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

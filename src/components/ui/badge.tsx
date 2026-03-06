import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground", className)} {...props} />;
}

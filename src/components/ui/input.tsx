import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-border/80 bg-card/70 px-4 text-sm text-foreground shadow-sm transition duration-300 placeholder:text-muted-foreground/80 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30",
        className,
      )}
      {...props}
    />
  );
}

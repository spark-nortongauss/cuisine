import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-border bg-card/95 px-4 py-3 text-sm text-card-foreground shadow-sm transition duration-300 placeholder:text-muted-foreground/80 focus:border-primary/55 focus:outline-none focus:ring-2 focus:ring-primary/35",
        className,
      )}
      {...props}
    />
  );
}

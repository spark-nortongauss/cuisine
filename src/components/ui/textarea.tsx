import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-2xl border border-[hsl(var(--input-border))] bg-[hsl(var(--input-bg))] px-4 py-3 text-sm text-card-foreground shadow-soft transition duration-200 placeholder:text-[hsl(var(--placeholder))] disabled:bg-muted/60 disabled:text-muted-foreground focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/30",
        className,
      )}
      {...props}
    />
  );
}

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description: string;
  chips?: string[];
  className?: string;
}

export function PageHero({ eyebrow, title, description, chips = [], className }: PageHeroProps) {
  return (
    <div className={cn("grain-overlay relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-luxe md:p-8", className)}>
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent/30 blur-3xl" aria-hidden />
      <div className="relative space-y-4">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="max-w-3xl font-serif text-4xl leading-tight md:text-5xl">{title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <Badge key={chip} variant="accent">
                {chip}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

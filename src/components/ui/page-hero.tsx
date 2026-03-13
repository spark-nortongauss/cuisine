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
    <div className={cn("grain-overlay relative overflow-hidden rounded-[2rem] border border-white/10 bg-hero-luxury p-6 text-foreground shadow-luxe md:p-10", className)}>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_34%,rgba(255,255,255,0.02))]" aria-hidden />
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-20 right-16 h-44 w-44 rounded-full bg-accent/20 blur-3xl" aria-hidden />
      <div className="relative space-y-5">
        {eyebrow ? <p className="text-xs uppercase tracking-[0.32em] text-primary">{eyebrow}</p> : null}
        <h1 className="max-w-4xl font-serif text-4xl leading-[1.06] tracking-[0.012em] md:text-6xl md:leading-[1.02]">{title}</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-foreground/78 md:text-base">{description}</p>
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

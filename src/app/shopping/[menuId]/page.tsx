import { CheckCircle2, Circle, Fish, Leaf, Milk } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";

const items = [
  ["vegetables", "Fennel", "3", "pcs", false, Leaf],
  ["fish", "Turbot", "2", "kg", true, Fish],
  ["dairy", "Crème fraîche", "500", "ml", false, Milk],
] as const;

export default function ShoppingPage() {
  return (
    <PageTransition>
      <PageHero
        eyebrow="Operational Workspace"
        title="Shopping list, elevated"
        description="Track purchases with clear sectioning, completion feedback, and smooth mobile-first interactions."
      />
      <Card className="space-y-4">
        <div className="sticky top-3 z-10 rounded-2xl border border-border/70 bg-card/90 p-3 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
          <p className="font-serif text-2xl">1 / 3 purchased</p>
          <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 w-1/3 rounded-full bg-success" /></div>
        </div>
        {items.map(([section, name, qty, unit, purchased, Icon]) => (
          <div key={name} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/80 p-3 text-sm transition hover:border-primary/30">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-xl bg-muted p-2 text-muted-foreground"><Icon size={14} /></span>
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{section} · {qty} {unit}</p>
              </div>
            </div>
            <button aria-label={`Purchased ${name}`} className="text-primary">
              {purchased ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-muted-foreground" />}
            </button>
          </div>
        ))}
      </Card>
    </PageTransition>
  );
}

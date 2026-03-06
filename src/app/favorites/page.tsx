import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Badge } from "@/components/ui/badge";

export default function FavoritesPage() {
  return (
    <PageTransition>
      <PageHero
        eyebrow="Curated Archive"
        title="Favorites, refined and collectible"
        description="Revisit top-rated menus and relaunch memorable gastronomic experiences with one click."
      />
      <Link href="/favorites/sample" className="block">
        <Card className="group overflow-hidden transition hover:-translate-y-1 hover:shadow-glow">
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-center">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Signature Dinner</p>
              <h2 className="font-serif text-3xl">Nocturne Terroir</h2>
              <p className="text-sm text-muted-foreground">Dinner · 10 people · gluten-free · seafood-forward</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-muted/30 to-card p-4">
              <p className="mb-2 flex items-center gap-2 text-sm"><Heart size={15} className="text-primary" />Guest sentiment</p>
              <Badge variant="accent" className="mb-2"><Star size={12} />92% rating</Badge>
              <p className="text-xs text-muted-foreground">Saved for high post-service delight and repeatability.</p>
            </div>
          </div>
        </Card>
      </Link>
    </PageTransition>
  );
}

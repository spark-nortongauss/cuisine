import { Calendar, ShoppingBasket, Users } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Badge } from "@/components/ui/badge";

export default function FavoriteDetailPage() {
  return (
    <PageTransition>
      <PageHero
        eyebrow="Favorite Detail"
        title="Nocturne Terroir"
        description="A celebrated signature menu with strong post-dinner sentiment and repeat-service potential."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Users size={14} />Invitees</p><p className="mt-2">Ava, Theo, Camille</p></Card>
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><ShoppingBasket size={14} />Shopping</p><p className="mt-2">42 items across 10 sections.</p></Card>
        <Card><p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Calendar size={14} />Reusability</p><p className="mt-2">Ideal for 8-12 guests.</p></Card>
      </div>
      <Card variant="feature" className="space-y-2">
        <Badge variant="accent" className="w-fit">Saved because post-meal rating exceeded 80%</Badge>
        <p className="text-sm">Cook notes: Keep scallops dry before searing and finish beurre blanc just before pass.</p>
      </Card>
      <Button>Cook again</Button>
    </PageTransition>
  );
}

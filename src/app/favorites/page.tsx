import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FavoritesPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-4xl">Favorites</h1>
      <Link href="/favorites/sample">
        <Card className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-medium">Nocturne Terroir</p>
            <Badge>92%</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Dinner · 10 people · gluten-free</p>
        </Card>
      </Link>
    </section>
  );
}

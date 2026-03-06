import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FavoriteDetailPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-4xl">Nocturne Terroir</h1>
      <Card>
        <p className="text-sm text-muted-foreground">Saved because post-meal rating exceeded 80%.</p>
        <p className="mt-2 text-sm">Invitees: Ava, Theo, Camille</p>
        <p className="text-sm">Shopping summary: 42 items across 10 sections.</p>
        <p className="text-sm">Cook notes: Keep scallops dry before searing.</p>
      </Card>
      <Button>Cook again</Button>
    </section>
  );
}

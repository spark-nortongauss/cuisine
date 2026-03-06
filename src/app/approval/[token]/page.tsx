import { CheckCircle2 } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Textarea } from "@/components/ui/textarea";

export default function ApprovalTokenPage() {
  return (
    <PageTransition>
      <PageHero
        eyebrow="Secure Invitee View"
        title="Menu Approval"
        description="Review each curated option and cast your preference to help finalize tonight's culinary direction."
      />
      <div className="grid gap-3">
        {[1, 2, 3].map((option) => (
          <Card key={option} className="space-y-3 transition hover:-translate-y-0.5 hover:shadow-luxe">
            <h2 className="font-serif text-2xl">Option {option}</h2>
            <p className="text-sm text-muted-foreground">Preview menu details from secure token route.</p>
            <Button variant="outline" className="w-full md:w-auto"><CheckCircle2 size={15} />Vote this option</Button>
          </Card>
        ))}
      </div>
      <Textarea placeholder="Optional note" />
    </PageTransition>
  );
}

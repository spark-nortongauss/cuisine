import { Clock3 } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";

const timeline = ["T-1 day", "T-4h", "T-2h", "T-45min", "T-10min", "Serve"];

export default function CookPage() {
  return (
    <PageTransition>
      <PageHero
        eyebrow="Service Timeline"
        title="Cook execution with calm precision"
        description="Follow a clear, premium timeline for prep, plating, and service orchestration from mise en place to final pass."
      />
      <div className="space-y-3">
        {timeline.map((slot, index) => (
          <Card key={slot} className="relative overflow-hidden">
            <div className="absolute left-6 top-0 h-full w-px bg-border" aria-hidden />
            <div className="relative flex gap-4">
              <span className="mt-1 rounded-full bg-primary p-2 text-primary-foreground"><Clock3 size={14} /></span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{slot}</p>
                <p className="mt-1 text-sm">Detailed prep, mise-en-place, and plating instructions for marker {index + 1}.</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageTransition>
  );
}

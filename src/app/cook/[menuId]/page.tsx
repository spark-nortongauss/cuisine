import { Card } from "@/components/ui/card";

const timeline = ["T-1 day", "T-4h", "T-2h", "T-45min", "T-10min", "Serve"];

export default function CookPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-4xl">Cook Plan</h1>
      <div className="space-y-3">
        {timeline.map((slot) => (
          <Card key={slot}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{slot}</p>
            <p className="text-sm">Detailed prep, mise-en-place, and plating instructions for this timing marker.</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

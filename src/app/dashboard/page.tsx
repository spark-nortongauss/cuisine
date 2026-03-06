import { ArrowRight, ChartSpline, ConciergeBell, Sparkles } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Badge } from "@/components/ui/badge";

const pillars = [
  {
    title: "Menu Generation",
    text: "AI-orchestrated tasting options with refined culinary language and premium service cues.",
    icon: Sparkles,
  },
  {
    title: "Approval Intelligence",
    text: "Tokenized voting with clear leadership signals, invitee sentiment, and decision confidence.",
    icon: ChartSpline,
  },
  {
    title: "Operational Mastery",
    text: "Shopping, prep, and service timelines translated into executive-grade culinary execution.",
    icon: ConciergeBell,
  },
];

export default function DashboardPage() {
  return (
    <PageTransition>
      <PageHero
        eyebrow="Executive kitchen operations"
        title="Design world-class dining moments from one premium workspace"
        description="Generate Michelin-level menus, orchestrate invitee consensus, and execute service with confidence across every station."
        chips={["Luxury Hospitality", "AI Culinary Intelligence", "Enterprise Clarity"]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {pillars.map(({ title, text, icon: Icon }) => (
          <Card key={title} className="space-y-4 transition hover:-translate-y-1 hover:shadow-glow">
            <div className="flex items-center justify-between">
              <span className="rounded-2xl bg-primary/10 p-2 text-primary">
                <Icon size={18} />
              </span>
              <ArrowRight size={14} className="text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="text-sm text-muted-foreground">{text}</p>
          </Card>
        ))}
      </div>

      <Card variant="feature" className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Today</p>
          <p className="font-serif text-3xl">6 invitees · 3 curated options · 1 final service</p>
        </div>
        <Badge variant="success">Workflow healthy</Badge>
      </Card>
    </PageTransition>
  );
}

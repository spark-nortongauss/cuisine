import { CheckCircle2, Clock3, Trophy, Users } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";

const stats = [
  { label: "Responses", value: "4 / 6", icon: Users },
  { label: "Pending", value: "2", icon: Clock3 },
  { label: "Leader", value: "Nocturne Terroir", icon: Trophy },
];

export default function ApprovalDashboardPage() {
  return (
    <PageTransition>
      <PageHero
        eyebrow="Approval Intelligence"
        title="Monitor consensus with confidence"
        description="Track invitee responses, compare menu preference momentum, and validate when your final service is clear."
      />

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Icon size={14} />{label}</p>
            <p className="font-serif text-3xl">{value}</p>
          </Card>
        ))}
      </div>

      <Card variant="feature" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Completion</p>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-accent" />
          </div>
        </div>
        <Button className="w-full md:w-auto">
          <CheckCircle2 size={16} />
          Validate Menu
        </Button>
      </Card>
    </PageTransition>
  );
}

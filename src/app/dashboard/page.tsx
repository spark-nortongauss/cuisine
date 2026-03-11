import { ArrowRight, ChartSpline, ConciergeBell, Sparkles } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Badge } from "@/components/ui/badge";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

const getPillars = (t: (key: string, fallback?: string) => string) => [
  {
    title: t("dashboard.pillars.generationTitle", "Menu Generation"),
    text: t("dashboard.pillars.generationText", "AI-orchestrated tasting options with refined culinary language and premium service cues."),
    icon: Sparkles,
  },
  {
    title: t("dashboard.pillars.approvalTitle", "Approval Intelligence"),
    text: t("dashboard.pillars.approvalText", "Tokenized voting with clear leadership signals, invitee sentiment, and decision confidence."),
    icon: ChartSpline,
  },
  {
    title: t("dashboard.pillars.operationsTitle", "Operational Mastery"),
    text: t("dashboard.pillars.operationsText", "Shopping, prep, and service timelines translated into executive-grade culinary execution."),
    icon: ConciergeBell,
  },
];

export default async function DashboardPage() {
  const locale = await getServerLocale();
  const t = getServerT(locale);
  const pillars = getPillars(t);
  return (
    <PageTransition>
      <PageHero
        eyebrow={t("dashboard.eyebrow", "Executive kitchen operations")}
        title={t("dashboard.title", "Design world-class dining moments from one premium workspace")}
        description={t("dashboard.description", "Generate Michelin-level menus, orchestrate invitee consensus, and execute service with confidence across every station.")}
        chips={[t("dashboard.chips.hospitality", "Luxury Hospitality"), t("dashboard.chips.ai", "AI Culinary Intelligence"), t("dashboard.chips.clarity", "Enterprise Clarity")]}
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
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("dashboard.today", "Today")}</p>
          <p className="font-serif text-3xl">{t("dashboard.snapshot", "6 invitees · 3 curated options · 1 final service")}</p>
        </div>
        <Badge variant="success">{t("dashboard.workflowHealthy", "Workflow healthy")}</Badge>
      </Card>
    </PageTransition>
  );
}

import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Textarea } from "@/components/ui/textarea";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

export default async function FeedbackTokenPage() {
  const locale = await getServerLocale();
  const t = getServerT(locale);

  return (
    <PageTransition className="mx-auto max-w-3xl">
      <PageHero
        eyebrow={t("feedback.eyebrow", "Post-Service Feedback")}
        title={t("feedback.title", "Tell us about your dining experience")}
        description={t("feedback.description", "Your notes directly improve future menu curation, pacing, and guest delight for upcoming events.")}
      />
      <Card variant="glass" className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("feedback.helper", "Thanks for joining. Share your experience to help future menu curation.")}</p>
        <Textarea placeholder={t("feedback.placeholder", "Your notes")} />
        <Button className="w-full md:w-auto">{t("feedback.submit", "Submit feedback")}</Button>
      </Card>
    </PageTransition>
  );
}

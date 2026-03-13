import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { Textarea } from "@/components/ui/textarea";

export default function FeedbackTokenPage() {
  return (
    <PageTransition className="mx-auto max-w-3xl">
      <PageHero
        eyebrow="Post-Service Feedback"
        title="Tell us about your dining experience"
        description="Your notes directly improve future menu curation, pacing, and guest delight for upcoming events."
      />
      <Card variant="glass" className="space-y-3">
        <p className="text-sm text-muted-foreground">Thanks for joining. Share your experience to help future menu curation.</p>
        <Textarea placeholder="Your notes" />
        <Button className="w-full md:w-auto">Submit feedback</Button>
      </Card>
    </PageTransition>
  );
}

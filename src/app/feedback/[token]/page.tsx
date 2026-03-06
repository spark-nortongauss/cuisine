import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function FeedbackTokenPage() {
  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="font-serif text-4xl">Dinner Feedback</h1>
      <Card className="space-y-3">
        <p className="text-sm text-muted-foreground">Thanks for joining. Share your experience to help future menu curation.</p>
        <Textarea placeholder="Your notes" />
        <Button className="w-full">Submit feedback</Button>
      </Card>
    </section>
  );
}

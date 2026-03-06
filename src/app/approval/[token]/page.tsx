import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ApprovalTokenPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-4xl">Menu Approval</h1>
      {[1, 2, 3].map((option) => (
        <Card key={option} className="space-y-2">
          <h2 className="font-serif text-2xl">Option {option}</h2>
          <p className="text-sm text-muted-foreground">Preview menu details from secure token route.</p>
          <Button variant="outline">Vote this option</Button>
        </Card>
      ))}
      <Textarea placeholder="Optional note" />
    </section>
  );
}

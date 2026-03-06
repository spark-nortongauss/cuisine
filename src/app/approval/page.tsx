import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ApprovalDashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-4xl">Approval Dashboard</h1>
      <Card className="space-y-2">
        <p className="text-sm text-muted-foreground">Track invitee responses, identify leading menu option, and validate when all votes are in.</p>
        <div className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
          <span>Responses</span>
          <span>4 / 6</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted p-3 text-sm">
          <span>Leading option</span>
          <span>"Nocturne Terroir"</span>
        </div>
        <Button className="w-full">Validate Menu</Button>
      </Card>
    </section>
  );
}

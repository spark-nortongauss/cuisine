import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-4xl">Gastronomic Cuisine</h1>
      <p className="max-w-2xl text-muted-foreground">Generate Michelin-level menus, orchestrate approvals, automate shopping/cook plans, and convert post-meal delight into reusable favorites.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Menu generation", "AI-powered 3-option menu synthesis with luxury presentation."],
          ["Approval workflow", "Tokenized SMS voting with invitee notes and leader insights."],
          ["Operational execution", "Auto shopping list, timeline, and post-meal rating capture."],
        ].map(([title, text]) => (
          <Card key={title}>
            <h2 className="font-serif text-2xl">{title}</h2>
            <p className="text-sm text-muted-foreground">{text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

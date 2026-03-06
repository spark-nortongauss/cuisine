import { Card } from "@/components/ui/card";

const items = [
  ["vegetables", "Fennel", "3", "pcs", false],
  ["fish", "Turbot", "2", "kg", true],
  ["dairy", "Crème fraîche", "500", "ml", false],
] as const;

export default function ShoppingPage() {
  return (
    <section className="space-y-4">
      <h1 className="font-serif text-4xl">Shopping List</h1>
      <Card className="space-y-3">
        <div className="sticky top-2 rounded-xl bg-muted p-3 text-sm">Progress: 1 / 3 purchased</div>
        {items.map(([section, name, qty, unit, purchased]) => (
          <div key={name} className="flex items-center justify-between rounded-xl border border-border p-3 text-sm">
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{section} · {qty} {unit}</p>
            </div>
            <input type="checkbox" defaultChecked={purchased} aria-label={`Purchased ${name}`} />
          </div>
        ))}
      </Card>
    </section>
  );
}

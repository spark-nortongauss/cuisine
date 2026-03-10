import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card variant="muted" className="text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-card/80">
        <Inbox className="text-primary" size={20} />
      </div>
      <p className="font-serif text-2xl">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ShoppingItem = {
  id: string;
  section: string | null;
  item_name: string | null;
  quantity: number | null;
  unit: string | null;
  purchased: boolean | null;
};

type Props = {
  shoppingListId: string;
  initialStatus: string;
  initialItems: ShoppingItem[];
};

export function ShoppingListDetail({ shoppingListId, initialItems, initialStatus }: Props) {
  const [items, setItems] = useState(initialItems.map((item) => ({ ...item, purchased: Boolean(item.purchased) })));
  const [status, setStatus] = useState(initialStatus);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isMarkingPurchased, setIsMarkingPurchased] = useState(false);
  const router = useRouter();

  const checkedCount = useMemo(() => items.filter((item) => item.purchased).length, [items]);

  async function toggleItem(itemId: string, purchased: boolean) {
    const before = items;
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, purchased } : item)));
    setIsSaving(itemId);

    const res = await fetch(`/api/shopping/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchased }),
    });

    if (!res.ok) {
      setItems(before);
    }
    setIsSaving(null);
  }

  async function markPurchased() {
    setIsMarkingPurchased(true);
    const res = await fetch(`/api/shopping/lists/${shoppingListId}/purchase`, { method: "POST" });
    if (res.ok) {
      setStatus("purchased");
      router.refresh();
    }
    setIsMarkingPurchased(false);
  }

  return (
    <Card className="space-y-4">
      <div className="sticky top-3 z-10 rounded-2xl border border-border/70 bg-card/90 p-3 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Progress</p>
        <p className="font-serif text-2xl">{checkedCount} / {items.length} purchased</p>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div className="h-2 rounded-full bg-success" style={{ width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` }} />
        </div>
      </div>

      {items.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/70 bg-card/80 p-3 text-sm transition hover:border-primary/30">
          <div>
            <p className="font-medium">{item.item_name}</p>
            <p className="text-xs text-muted-foreground">{item.section} · {item.quantity} {item.unit}</p>
          </div>
          <input
            type="checkbox"
            checked={item.purchased}
            onChange={(event) => toggleItem(item.id, event.target.checked)}
            disabled={isSaving === item.id || status === "purchased"}
            className="sr-only"
          />
          <span className="text-primary">
            {item.purchased ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-muted-foreground" />}
          </span>
        </label>
      ))}

      <Button className="w-full" onClick={markPurchased} disabled={status === "purchased" || isMarkingPurchased}>
        {status === "purchased" ? "Shopping purchased" : "Mark shopping as purchased"}
      </Button>
    </Card>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

type ShoppingItem = {
  id: string;
  section: string | null;
  item_name: string | null;
  quantity: number | null;
  unit: string | null;
  note?: string | null;
  purchased: boolean | null;
};

type Props = {
  menuId: string;
  initialItems: ShoppingItem[];
};

export function ShoppingListDetail({ menuId, initialItems }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState(initialItems.map((item) => ({ ...item, purchased: Boolean(item.purchased) })));
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkedCount = useMemo(() => items.filter((item) => item.purchased).length, [items]);
  const totalItems = items.length;
  const allPurchased = totalItems > 0 && checkedCount === totalItems;

  async function toggleItem(itemId: string, purchased: boolean) {
    const previousValue = items.find((item) => item.id === itemId)?.purchased ?? false;
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, purchased } : item)));
    setIsSaving(itemId);
    setError(null);

    const res = await fetch(`/api/shopping/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ purchased }),
    });

    if (!res.ok) {
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, purchased: previousValue } : item)));
      setError(t("shopping.updateItemError", "Could not update one item. Please try again."));
    }
    setIsSaving(null);
  }

  async function generateCooking() {
    if (!allPurchased || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    const res = await fetch(`/api/shopping/menus/${menuId}/generate-cooking`, { method: "POST" });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? t("shopping.generateCookingError", "Could not generate cooking timeline. Please try again."));
      setIsGenerating(false);
      return;
    }

    router.push(`/cook/${menuId}`);
    router.refresh();
  }

  if (!items.length) {
    return (
      <Card>
        <p className="text-sm text-muted-foreground">{t("shopping.noItems", "No shopping items yet.")}</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="sticky top-3 z-10 rounded-2xl border border-border/70 bg-card/90 p-3 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("common.table.progress", "Progress")}</p>
        <p className="font-serif text-2xl">{checkedCount} / {items.length} {t("shopping.purchased", "purchased")}</p>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <div className="h-2 rounded-full bg-success" style={{ width: `${items.length ? (checkedCount / items.length) * 100 : 0}%` }} />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {allPurchased
              ? t("shopping.allPurchased", "All items purchased. You can now generate your cooking execution timeline.")
              : t("shopping.lockedGenerateCooking", "Generate Cooking unlocks when every shopping item is purchased.")}
          </p>
          <Button onClick={generateCooking} disabled={!allPurchased || isGenerating}>
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {t("shopping.generateCooking", "Generate Cooking")}
          </Button>
        </div>
      </div>

      {items.map((item) => (
        <label key={item.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 text-sm transition hover:border-primary/30">
          <div className="space-y-1">
            <p className="font-medium">{item.item_name}</p>
            <p className="text-xs text-muted-foreground">{item.section ?? t("shopping.general", "General")} · {item.quantity ?? "-"} {item.unit ?? ""}</p>
            {item.note ? <p className="text-xs text-muted-foreground">{t("shopping.note", "Note")}: {item.note}</p> : null}
          </div>
          <input
            type="checkbox"
            checked={item.purchased}
            onChange={(event) => toggleItem(item.id, event.target.checked)}
            disabled={isSaving === item.id}
            className="sr-only"
          />
          <span className="text-primary">
            {item.purchased ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-muted-foreground" />}
          </span>
        </label>
      ))}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </Card>
  );
}

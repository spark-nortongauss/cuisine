"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import {
  isShoppingItemComplete,
  mapShoppingStatusToPurchased,
  normalizeShoppingItemStatus,
  type ShoppingItemStatus,
} from "@/lib/shopping-status";
import { localizeShoppingStatus } from "@/lib/i18n/labels";

type ShoppingItem = {
  id: string;
  section: string | null;
  item_name: string | null;
  quantity: number | null;
  unit: string | null;
  note?: string | null;
  purchased: boolean | null;
  status?: string | null;
  estimated_unit_price_eur?: number | null;
  estimated_total_price_eur?: number | null;
};

type Props = {
  menuId: string;
  initialItems: ShoppingItem[];
  estimatedTotalEur: number | null;
};

export function ShoppingListDetail({ menuId, initialItems, estimatedTotalEur }: Props) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState(() => initialItems.map((item) => {
    const status = normalizeShoppingItemStatus(item.status, item.purchased);
    return {
      ...item,
      status,
      purchased: mapShoppingStatusToPurchased(status),
    };
  }));
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = useMemo(() => items.filter((item) => isShoppingItemComplete(item.status, item.purchased)).length, [items]);
  const eur = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
  const statusButtons: ShoppingItemStatus[] = ["purchased", "already_have", "not_purchased"];

  async function updateItemStatus(itemId: string, status: ShoppingItemStatus) {
    const previousItem = items.find((item) => item.id === itemId);
    if (!previousItem || previousItem.status === status) return;

    setItems((prev) => prev.map((item) => (
      item.id === itemId ? { ...item, status, purchased: mapShoppingStatusToPurchased(status) } : item
    )));
    setIsSaving(itemId);
    setError(null);

    const res = await fetch(`/api/shopping/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      setItems((prev) => prev.map((item) => (item.id === itemId ? previousItem : item)));
      setError(t("shopping.updateItemError", "Could not update one item. Please try again."));
    }
    setIsSaving(null);
  }

  async function generateCooking() {
    if (isGenerating) return;

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
      <div className="sticky top-3 z-10 rounded-2xl border border-primary/20 bg-card/90 p-3 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("common.table.progress", "Progress")}</p>
        <p className="font-serif text-2xl">{completedCount} / {items.length} {t("shopping.completed", "completed")}</p>
        <div className="mt-2 h-2 rounded-full bg-muted">
          <motion.div
            className="h-2 rounded-full bg-success"
            animate={{ width: `${items.length ? (completedCount / items.length) * 100 : 0}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium">{t("shopping.estimatedTotalFrance", "Estimated total in France")}: ~{estimatedTotalEur !== null ? eur.format(estimatedTotalEur) : t("common.notAvailable", "N/A")}</p>
          <p className="text-xs text-muted-foreground">{t("shopping.estimateDisclaimer", "Approximate AI estimate in EUR, for planning only.")}</p>
          <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {t("shopping.generateCookingAvailable", "Generate Cooking is available once your shopping list exists.")}
          </p>
          <Button onClick={generateCooking} disabled={isGenerating}>
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {t("shopping.generateCooking", "Generate Cooking")}
          </Button>
          </div>
        </div>
      </div>

      {items.map((item) => {
        const isDone = isShoppingItemComplete(item.status, item.purchased);
        return (
          <div
            key={item.id}
            className={cn(
              "rounded-2xl border bg-card/75 p-3 text-sm transition",
              isDone ? "border-success/40" : "border-border/70",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium text-card-foreground">{item.item_name}</p>
                <p className="text-xs text-muted-foreground">{item.section ?? t("shopping.general", "General")} · {item.quantity ?? "-"} {item.unit ?? ""}</p>
                {item.note ? <p className="text-xs text-muted-foreground">{t("shopping.note", "Note")}: {item.note}</p> : null}
                <p className="text-xs text-muted-foreground">{t("shopping.estimatedItemPrice", "Estimated price")}: ~{item.estimated_total_price_eur !== null && item.estimated_total_price_eur !== undefined ? eur.format(item.estimated_total_price_eur) : item.estimated_unit_price_eur !== null && item.estimated_unit_price_eur !== undefined ? `${eur.format(item.estimated_unit_price_eur)} / ${item.unit ?? t("shopping.item", "item")}` : t("common.notAvailable", "N/A")}</p>
              </div>
              <span className="text-primary">
                {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-muted-foreground" />}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {statusButtons.map((nextStatus) => {
                const active = item.status === nextStatus;
                return (
                  <button
                    key={`${item.id}-${nextStatus}`}
                    type="button"
                    onClick={() => void updateItemStatus(item.id, nextStatus)}
                    disabled={isSaving === item.id}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      active
                        ? "border-primary/60 bg-primary/10 text-primary"
                        : "border-border/70 bg-card/70 text-muted-foreground hover:border-primary/40 hover:text-card-foreground",
                    )}
                  >
                    {localizeShoppingStatus(nextStatus, t)}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t("shopping.currentStatus", "Current status")}: {localizeShoppingStatus(item.status, t)}
            </p>
          </div>
        );
      })}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </Card>
  );
}

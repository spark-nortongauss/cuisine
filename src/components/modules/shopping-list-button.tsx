"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShoppingListButton({ menuId }: { menuId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureShoppingList() {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/shopping/lists/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuId }),
    });

    const payload = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;

    if (!res.ok || !payload?.success) {
      setError(payload?.error ?? "Could not open shopping list");
      setIsLoading(false);
      return;
    }

    router.push(`/shopping/${menuId}`);
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={ensureShoppingList}
        disabled={isLoading}
        size="icon"
        aria-label={isLoading ? "Preparing shopping list..." : "Shopping List"}
        title={isLoading ? "Preparing shopping list..." : "Shopping List"}
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBasket size={16} />}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

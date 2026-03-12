"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

export function FavoriteMenuButton({ menuId, initialFavorited }: { menuId: string; initialFavorited: boolean }) {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [error, setError] = useState<string | null>(null);

  async function favoriteMenu() {
    if (isLoading || isFavorited) return;

    setIsLoading(true);
    setError(null);

    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ menuId }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error ?? t("favorites.favoriteError", "Could not add menu to favorites."));
      setIsLoading(false);
      return;
    }

    setIsFavorited(true);
    setIsLoading(false);
  }

  return (
    <div className="space-y-1">
      <Button onClick={favoriteMenu} disabled={isLoading || isFavorited} variant={isFavorited ? "secondary" : "default"}>
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Heart size={16} />}
        {isFavorited ? t("favorites.favorited", "Favorited") : t("favorites.favorite", "Favorite")}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

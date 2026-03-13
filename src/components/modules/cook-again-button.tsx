"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CookAgainButton({ menuId }: { menuId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const response = await fetch(`/api/favorites/${menuId}/cook-again`, { method: "POST" });
      const payload: { success?: boolean; cookUrl?: string } = await response.json();
      if (payload.success && payload.cookUrl) {
        router.push(payload.cookUrl);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" onClick={handleClick} disabled={loading}>
      {loading ? "Preparing..." : "Cook Again"}
    </Button>
  );
}

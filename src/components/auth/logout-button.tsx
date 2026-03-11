"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

export function LogoutButton() {
  const { t } = useI18n();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 border-accent/40 bg-card/95 text-card-foreground"
      onClick={() => {
        window.location.href = "/auth/logout";
      }}
    >
      <LogOut size={14} />
      {t("app.logout", "Logout")}
    </Button>
  );
}

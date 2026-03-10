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
      className="gap-2 border-primary/30 bg-card/95"
      onClick={() => {
        window.location.href = "/auth/logout";
      }}
    >
      <LogOut size={14} />
      {t("app.logout", "Logout")}
    </Button>
  );
}

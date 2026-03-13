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
      className="h-11 w-11 gap-2 border-white/10 bg-white/[0.04] px-0 text-card-foreground sm:w-auto sm:px-4"
      onClick={() => {
        window.location.href = "/auth/logout";
      }}
      aria-label={t("app.logout", "Logout")}
      title={t("app.logout", "Logout")}
    >
      <LogOut size={15} />
      <span className="hidden sm:inline">{t("app.logout", "Logout")}</span>
    </Button>
  );
}

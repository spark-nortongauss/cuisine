"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 border-primary/20 bg-card/70"
      onClick={() => {
        window.location.href = "/auth/logout";
      }}
    >
      <LogOut size={14} />
      Logout
    </Button>
  );
}

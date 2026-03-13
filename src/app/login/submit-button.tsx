"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

export function LoginSubmitButton() {
  const { t } = useI18n();
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? t("login.signingIn", "Signing in...") : t("login.signIn", "Sign in")}
    </Button>
  );
}

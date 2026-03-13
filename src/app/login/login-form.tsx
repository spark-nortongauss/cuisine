"use client";

import { useActionState } from "react";
import { Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/i18n-provider";
import { loginAction } from "./actions";
import { LoginSubmitButton } from "./submit-button";

const initialState = { error: "" };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath ?? "/dashboard"} />
      {state.error ? <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      <div className="space-y-2">
        <label htmlFor="email" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail size={14} />
          {t("login.email", "Email")}
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock size={14} />
          {t("login.password", "Password")}
        </label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <LoginSubmitButton />
    </form>
  );
}

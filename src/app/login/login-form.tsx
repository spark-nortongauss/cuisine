"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { loginAction } from "./actions";
import { LoginSubmitButton } from "./submit-button";

const initialState = { error: "" };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath ?? "/dashboard"} />
      {state.error ? <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-muted-foreground">
          Email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm text-muted-foreground">
          Password
        </label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <LoginSubmitButton />
    </form>
  );
}

"use server";

import { redirect } from "next/navigation";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

export type LoginState = {
  error?: string;
};

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const locale = await getServerLocale();
  const t = getServerT(locale);
  const email = formData.get("email");
  const password = formData.get("password");
  const nextPath = formData.get("next");

  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return { error: t("login.errors.missingCredentials", "Enter both email and password.") };
  }

  const supabase = await createSupabaseRouteHandlerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { error: t("login.errors.invalidCredentials", "Invalid credentials. Please try again.") };
  }

  const destination = typeof nextPath === "string" && nextPath.startsWith("/") ? nextPath : "/dashboard";
  redirect(destination);
}

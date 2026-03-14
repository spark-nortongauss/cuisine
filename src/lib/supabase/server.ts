import { createServerClient } from "@/lib/supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";

export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase server configuration");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            const maybePromise = cookieStore.set(name, value, options) as unknown;

            if (
              typeof maybePromise === "object" &&
              maybePromise !== null &&
              "then" in maybePromise &&
              typeof maybePromise.then === "function"
            ) {
              void (maybePromise as Promise<unknown>).catch(() => {
                // Server Components can't mutate cookies during render; middleware handles refresh writes.
              });
            }
          } catch {
            // Server Components can't mutate cookies during render; middleware handles refresh writes.
          }
        });
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing Supabase admin configuration");
  }

  return createClient<Database>(supabaseUrl, serviceRole, { auth: { persistSession: false } });
}

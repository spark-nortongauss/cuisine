import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
};

type ServerClientOptions = {
  cookies: CookieMethods;
};

export function createBrowserClient(supabaseUrl: string, supabaseKey: string): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseKey);
}

export function createServerClient(supabaseUrl: string, supabaseKey: string, options: ServerClientOptions): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: {
        getItem: (key) => {
          const item = options.cookies.getAll().find((cookie) => cookie.name === key);
          return item?.value ?? null;
        },
        setItem: (key, value) => {
          options.cookies.setAll([{ name: key, value, options: { path: "/" } }]);
        },
        removeItem: (key) => {
          options.cookies.setAll([{ name: key, value: "", options: { path: "/", maxAge: 0 } }]);
        },
      },
    },
  });
}

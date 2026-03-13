import { createBrowserClient as createSupabaseBrowserClient, createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) => void;
};

type ServerClientOptions = {
  cookies: CookieMethods;
};

export function createBrowserClient(supabaseUrl: string, supabaseKey: string): SupabaseClient<Database> {
  return createSupabaseBrowserClient(supabaseUrl, supabaseKey) as SupabaseClient<Database>;
}

export function createServerClient(supabaseUrl: string, supabaseKey: string, options: ServerClientOptions): SupabaseClient<Database> {
  return createSupabaseServerClient(supabaseUrl, supabaseKey, options) as SupabaseClient<Database>;
}

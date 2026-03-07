import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CookIndexPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: entries } = await supabase
    .from("cook_plans")
    .select("id, menu_id, created_at, menus(title, serve_at, owner_id)")
    .order("created_at", { ascending: false });

  const visibleEntries = (entries ?? []).filter((entry) => {
    const menu = Array.isArray(entry.menus) ? entry.menus[0] : entry.menus;
    return user?.id ? menu?.owner_id === user.id : false;
  });

  return (
    <PageTransition>
      <PageHero
        eyebrow="Service Timeline"
        title="Cook-ready services"
        description="Menus with generated cook plans are listed here."
      />

      <div className="space-y-3">
        {visibleEntries.length ? (
          visibleEntries.map((entry) => {
            const menu = Array.isArray(entry.menus) ? entry.menus[0] : entry.menus;
            return (
              <Link key={entry.id} href={`/cook/${entry.menu_id}`} className="block">
                <Card className="transition hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-2xl">{menu?.title ?? "Untitled menu"}</h2>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ready</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {menu?.serve_at
                      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at))
                      : "No service date"}
                  </p>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">No cook plans yet. Validate a menu to generate one.</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

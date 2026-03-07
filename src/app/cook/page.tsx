import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";

type MenuOption = {
  id: number;
  title: string | null;
  michelin_name: string | null;
};

export default async function CookIndexPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: entries } = await supabase
    .from("cook_plans")
    .select("id, menu_id, created_at, updated_at, menus(title, serve_at, owner_id, meal_type, approved_option_id, menu_options(id, title, michelin_name))")
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
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-3 py-2">Menu</th>
                  <th className="px-3 py-2">Meal</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Generated</th>
                  <th className="px-3 py-2">Readiness</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => {
                  const menu = Array.isArray(entry.menus) ? entry.menus[0] : entry.menus;
                  const approvedOption = (menu?.menu_options ?? []).find((option: MenuOption) => option.id === menu?.approved_option_id) ?? null;
                  return (
                    <tr key={entry.id} className="rounded-2xl border border-border/60 bg-card/70">
                      <td className="px-3 py-3 font-medium text-primary underline-offset-4 hover:underline">
                        <Link href={`/cook/${entry.menu_id}`}>{resolveMenuDisplayTitle(menu, approvedOption)}</Link>
                      </td>
                      <td className="px-3 py-3">{menu?.meal_type ?? "Service"}</td>
                      <td className="px-3 py-3">{menu?.serve_at ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at)) : "No service date"}</td>
                      <td className="px-3 py-3">{new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(entry.updated_at ?? entry.created_at))}</td>
                      <td className="px-3 py-3"><span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ready</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">No cook plans yet. Validate a menu to generate one.</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

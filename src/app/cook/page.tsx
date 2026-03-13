import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { PageTransition } from "@/components/layout/page-transition";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";

type MenuOption = {
  id: number;
  title: string | null;
  michelin_name: string | null;
};

export default async function CookIndexPage() {
  const locale = await getServerLocale();
  const t = getServerT(locale);
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
      <PageHero eyebrow={t("cook.heroEyebrow")} title={t("cook.indexTitle")} description={t("cook.indexDescription")} />

      <div className="space-y-3">
        {visibleEntries.length ? (
          <Card className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="px-3 py-2">{t("common.table.menu")}</th>
                  <th className="px-3 py-2">{t("common.table.meal")}</th>
                  <th className="px-3 py-2">{t("common.table.service")}</th>
                  <th className="px-3 py-2">{t("common.table.generated")}</th>
                  <th className="px-3 py-2">{t("common.table.readiness")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleEntries.map((entry) => {
                  const menu = Array.isArray(entry.menus) ? entry.menus[0] : entry.menus;
                  const approvedOption = (menu?.menu_options ?? []).find((option: MenuOption) => option.id === menu?.approved_option_id) ?? null;
                  return (
                    <tr key={entry.id} className="premium-row">
                      <td className="px-3 py-3 font-serif text-base text-primary underline-offset-4 hover:underline">
                        <Link href={`/cook/${entry.menu_id}`}>{resolveMenuDisplayTitle(menu, approvedOption)}</Link>
                      </td>
                      <td className="px-3 py-3">{menu?.meal_type ?? t("common.mealFallback")}</td>
                      <td className="px-3 py-3">{menu?.serve_at ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate")}</td>
                      <td className="px-3 py-3">{formatWithLocale(locale, new Date(entry.updated_at ?? entry.created_at), { dateStyle: "medium" })}</td>
                      <td className="px-3 py-3"><span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("common.ready")}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-muted-foreground">{t("cook.noPlans")}</p>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

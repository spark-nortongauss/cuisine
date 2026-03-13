import { CheckCircle2, Clock3, Trophy, Users } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { ApprovedMenusTable } from "@/components/modules/approved-menus-table";
import { resolveMenuDisplayTitle, resolveOptionDisplayTitle } from "@/lib/menu-display";
import { getServerLocale, getServerT } from "@/lib/i18n/server";
import { localizeMealType } from "@/lib/i18n/labels";

const APPROVED_STATUSES = new Set(["approved", "validated", "selected"]);

type ApprovedMenuView = {
  id: string;
  title: string;
  mealType: string;
  serveAt: string | null;
  inviteeCount: number | null;
  status: string;
  approvedOptionTitle: string;
  updatedAt: string;
};

export default async function ApprovalDashboardPage() {
  const locale = await getServerLocale();
  const t = getServerT(locale);

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: menus } = await supabase
    .from("menus")
    .select("id, title, status, serve_at, meal_type, invitee_count, approved_option_id, updated_at, menu_options(id, title, michelin_name)")
    .eq("owner_id", user?.id ?? "")
    .order("updated_at", { ascending: false });

  const approvedMenus: ApprovedMenuView[] = (menus ?? [])
    .filter((menu) => menu.approved_option_id || APPROVED_STATUSES.has(menu.status))
    .map((menu) => {
      const approvedOption = (menu.menu_options ?? []).find((option) => option.id === menu.approved_option_id);
      return {
        id: menu.id,
        title: resolveMenuDisplayTitle(menu, approvedOption, t("common.untitledMenu", "Untitled menu")),
        mealType: localizeMealType(menu.meal_type, t),
        serveAt: menu.serve_at,
        inviteeCount: menu.invitee_count,
        status: menu.status,
        approvedOptionTitle: resolveOptionDisplayTitle(approvedOption) ?? t("approval.selectedOption", "Selected option"),
        updatedAt: menu.updated_at,
      };
    });

  const validatedCount = approvedMenus.filter((menu) => menu.status === "validated").length;

  const stats = [
    { label: t("approval.stats.approved", "Approved"), value: String(approvedMenus.length), icon: Users },
    { label: t("approval.stats.validated", "Validated"), value: String(validatedCount), icon: CheckCircle2 },
    { label: t("approval.stats.leader", "Leader"), value: approvedMenus.length ? t("approval.optionSelected", "Option selected") : t("approval.pending", "Pending"), icon: Trophy },
  ];

  return (
    <PageTransition>
      <PageHero
        eyebrow={t("approval.eyebrow", "Approval Intelligence")}
        title={t("approval.title", "Approved menus")}
        description={t("approval.description", "Review approved services, open full menu details, and remove cancelled plans safely.")}
      />

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Icon size={14} />{label}</p>
            <p className="font-serif text-3xl">{value}</p>
          </Card>
        ))}
      </div>

      {approvedMenus.length ? (
        <ApprovedMenusTable rows={approvedMenus} />
      ) : (
        <Card>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 size={14} />{t("approval.empty", "No approved menus yet. Select an option on Generate to approve it.")}</p>
        </Card>
      )}
    </PageTransition>
  );
}

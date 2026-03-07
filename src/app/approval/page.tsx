import { CheckCircle2, Clock3, Trophy, Users } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ApprovalDashboardPage() {
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: menus } = await supabase
    .from("menus")
    .select("id, title, status, serve_at, meal_type, approved_option_id")
    .eq("owner_id", user?.id ?? "")
    .not("approved_option_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(6);

  const approvedCount = (menus ?? []).length;
  const validatedCount = (menus ?? []).filter((menu) => menu.status === "validated").length;

  const stats = [
    { label: "Approved", value: String(approvedCount), icon: Users },
    { label: "Validated", value: String(validatedCount), icon: CheckCircle2 },
    { label: "Leader", value: approvedCount ? "Option selected" : "Pending", icon: Trophy },
  ];

  return (
    <PageTransition>
      <PageHero
        eyebrow="Approval Intelligence"
        title="Monitor consensus with confidence"
        description="Track selected options and move quickly into validated shopping and cook operations."
      />

      <div className="grid gap-3 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Icon size={14} />{label}</p>
            <p className="font-serif text-3xl">{value}</p>
          </Card>
        ))}
      </div>

      <Card variant="feature" className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Selected menus</p>
          {(menus ?? []).length ? (
            <div className="space-y-2">
              {(menus ?? []).map((menu) => (
                <div key={menu.id} className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{menu.title ?? "Untitled menu"}</p>
                    <p className="text-xs text-muted-foreground">{menu.meal_type ?? "Service"} · {menu.status}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{menu.serve_at ? new Date(menu.serve_at).toLocaleDateString() : "No date"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 size={14} />No selected menus yet. Select an option on Generate to approve it.</p>
          )}
        </div>
      </Card>
    </PageTransition>
  );
}

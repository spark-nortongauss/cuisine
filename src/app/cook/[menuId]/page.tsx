import { notFound } from "next/navigation";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CookPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: menu } = await supabase.from("menus").select("id, owner_id, title, serve_at").eq("id", menuId).single();

  if (!menu) return notFound();
  if (user?.id && menu.owner_id !== user.id) return notFound();

  const { data: cookPlan } = await supabase
    .from("cook_plans")
    .select("id, overview, mise_en_place, plating_overview, service_notes")
    .eq("menu_id", menuId)
    .maybeSingle();

  if (!cookPlan) {
    return (
      <PageTransition>
        <PageHero
          eyebrow="Service Timeline"
          title={menu.title ?? "Cook Plan"}
          description={menu.serve_at ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at)) : "No service date"}
        />
        <Card>
          <p className="text-sm text-muted-foreground">No cook plan exists for this menu yet.</p>
        </Card>
      </PageTransition>
    );
  }

  const { data: steps } = await supabase
    .from("cook_steps")
    .select("id, step_no, phase, title, details, dish_name, relative_minutes")
    .eq("cook_plan_id", cookPlan.id)
    .order("step_no", { ascending: true });

  return (
    <PageTransition>
      <PageHero
        eyebrow="Service Timeline"
        title={menu.title ?? "Cook Plan"}
        description={menu.serve_at ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at)) : "No service date"}
      />

      <div className="space-y-3">
        <Card>
          <h2 className="font-serif text-2xl">Overview</h2>
          <p className="mt-2 text-sm text-muted-foreground">{cookPlan.overview ?? "No overview available."}</p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Mise en place</p>
          <p className="mt-1 text-sm">{cookPlan.mise_en_place ?? "No mise en place guidance."}</p>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl">Cook steps</h2>
          <div className="mt-3 space-y-2 text-sm">
            {(steps ?? []).map((step) => (
              <div key={step.id} className="rounded-xl border border-border/60 p-2">
                <p><strong>#{step.step_no}</strong> · {step.phase}</p>
                <p className="font-medium">{step.title}</p>
                <p className="text-muted-foreground">{step.details}</p>
                {step.dish_name ? <p className="text-xs text-muted-foreground">Dish: {step.dish_name}</p> : null}
              </div>
            ))}
            {!steps?.length ? <p className="text-muted-foreground">No steps generated.</p> : null}
          </div>
        </Card>

        <Card>
          <h2 className="font-serif text-2xl">Plating & service notes</h2>
          <p className="mt-2 text-sm text-muted-foreground">{cookPlan.plating_overview ?? "No plating overview."}</p>
          <p className="mt-2 text-sm">{cookPlan.service_notes ?? "No service notes."}</p>
        </Card>
      </div>
    </PageTransition>
  );
}

import { notFound } from "next/navigation";
import { Clock3, CookingPot } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import { CollapsibleSections } from "@/components/ui/collapsible-section";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { resolveStorageImageUrl } from "@/lib/menu-images";

function splitDetailPoints(details: string) {
  return details
    .split(/\n|•|\-/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export default async function CookPage({ params }: { params: Promise<{ menuId: string }> }) {
  const { menuId } = await params;
  const locale = await getServerLocale();
  const t = getServerT(locale);

  const supabaseServer = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  const supabase = createSupabaseAdminClient();
  const { data: menu } = await supabase.from("menus").select("id, owner_id, title, serve_at, approved_option_id, menu_options(id, title, michelin_name)").eq("id", menuId).single();

  if (!menu) return notFound();
  if (user?.id && menu.owner_id !== user.id) return notFound();

  const { data: cookPlan } = await supabase
    .from("cook_plans")
    .select("id, overview, mise_en_place, plating_overview, service_notes")
    .eq("menu_id", menuId)
    .maybeSingle();

  const approvedOption = (menu.menu_options ?? []).find((option) => option.id === menu.approved_option_id) ?? null;
  const displayTitle = resolveMenuDisplayTitle(menu, approvedOption);

  if (!cookPlan) {
    return (
      <PageTransition>
        <PageHero
          eyebrow={t("cook.heroEyebrow")}
          title={displayTitle}
          description={menu.serve_at ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate")}
        />
        <Card>
          <p className="text-sm text-muted-foreground">{t("cook.noPlanForMenu")}</p>
        </Card>
      </PageTransition>
    );
  }


  const { data: dishes } = menu.approved_option_id
    ? await supabase
      .from("menu_dishes")
      .select("id, course_no, course_label, dish_name, plating_notes, decoration_notes, image_path")
      .eq("menu_option_id", menu.approved_option_id)
      .order("course_no", { ascending: true })
    : { data: [] as Array<{ id: string; course_no: number; course_label: string | null; dish_name: string; plating_notes: string | null; decoration_notes: string | null; image_path: string | null }> };

  const dishImageUrls = await Promise.all((dishes ?? []).map((dish) => resolveStorageImageUrl({ supabase, path: dish.image_path })));

  const { data: steps } = await supabase
    .from("cook_steps")
    .select("id, step_no, phase, title, details, dish_name, relative_minutes")
    .eq("cook_plan_id", cookPlan.id)
    .order("relative_minutes", { ascending: true, nullsFirst: true })
    .order("step_no", { ascending: true });

  const sections = [
    {
      id: "overview",
      title: t("cook.overview"),
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{cookPlan.overview ?? t("cook.noOverview")}</p>
          <div>
            <p className="text-xs uppercase tracking-[0.2em]">{t("cook.miseEnPlace")}</p>
            <p className="mt-1 text-sm text-foreground">{cookPlan.mise_en_place ?? t("cook.noMise")}</p>
          </div>
        </div>
      ),
    },
    {
      id: "timeline",
      title: t("cook.timeline"),
      content: (
        <div className="space-y-3">
          {(steps ?? []).map((step) => {
            const detailPoints = splitDetailPoints(step.details);
            return (
              <div key={step.id} className="rounded-xl border border-border/60 bg-card/70 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{step.relative_minutes !== null ? `T${step.relative_minutes >= 0 ? "+" : ""}${step.relative_minutes} min` : `${t("cook.step")} ${step.step_no}`}</Badge>
                  <Badge variant="default">{step.phase}</Badge>
                  {step.dish_name ? <Badge variant="success">{t("cook.dish")}: {step.dish_name}</Badge> : null}
                </div>
                <p className="font-medium text-foreground">{step.title}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {detailPoints.map((line) => (
                    <li key={`${step.id}-${line}`} className="flex items-start gap-2"><CookingPot size={14} className="mt-0.5 text-primary" /> <span>{line}</span></li>
                  ))}
                </ul>
              </div>
            );
          })}
          {!steps?.length ? <p className="text-sm text-muted-foreground">{t("cook.noSteps")}</p> : null}
        </div>
      ),
    },
    {
      id: "plating",
      title: t("cook.plating"),
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{cookPlan.plating_overview ?? t("cook.noPlating")}</p>
          {(dishes ?? []).map((dish, index) => (
            <div key={dish.id} className="rounded-xl border border-border/60 bg-card/70 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{dish.course_label ?? `${t("approval.detail.course", "Course")} ${dish.course_no}`}</p>
              <p className="font-medium">{dish.dish_name}</p>
              <p className="text-sm text-muted-foreground">{dish.plating_notes ?? t("approval.detail.noPlatingNotes", "No plating notes")}</p>
              <p className="text-xs text-muted-foreground">{dish.decoration_notes ?? t("approval.detail.noDecorationNotes", "No decoration notes")}</p>
              {dishImageUrls[index] ? <img src={dishImageUrls[index] ?? undefined} alt={dish.dish_name} className="mt-2 h-36 w-full rounded-xl object-cover md:h-40 md:w-64" /> : null}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "service",
      title: t("cook.serviceNotes"),
      content: <p className="text-sm text-muted-foreground">{cookPlan.service_notes ?? t("cook.noServiceNotes")}</p>,
    },
  ];

  return (
    <PageTransition>
      <PageHero
        eyebrow={t("cook.heroEyebrow")}
        title={displayTitle}
        description={menu.serve_at ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" }) : t("common.noDate")}
      />
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><Clock3 size={14} />{t("cook.timeline")}</div>
      <CollapsibleSections sections={sections} defaultOpen={["overview", "timeline"]} />
    </PageTransition>
  );
}

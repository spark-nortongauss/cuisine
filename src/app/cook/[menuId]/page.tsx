/* eslint-disable @next/next/no-img-element */

import { notFound } from "next/navigation";
import { CalendarClock, Clock3, CookingPot, Sparkles } from "lucide-react";
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
    .split(/\n|\u2022|-/g)
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
  const { data: menu } = await supabase
    .from("menus")
    .select("id, owner_id, title, serve_at, approved_option_id, menu_options(id, title, michelin_name)")
    .eq("id", menuId)
    .single();

  if (!menu) return notFound();
  if (user?.id && menu.owner_id !== user.id) return notFound();

  const { data: cookPlan } = await supabase
    .from("cook_plans")
    .select("id, overview, mise_en_place, plating_overview, service_notes")
    .eq("menu_id", menuId)
    .maybeSingle();

  const approvedOption = (menu.menu_options ?? []).find((option) => option.id === menu.approved_option_id) ?? null;
  const displayTitle = resolveMenuDisplayTitle(menu, approvedOption);
  const serviceLabel = menu.serve_at
    ? formatWithLocale(locale, new Date(menu.serve_at), { dateStyle: "medium", timeStyle: "short" })
    : t("common.noDate", "No date");

  if (!cookPlan) {
    return (
      <PageTransition>
        <PageHero eyebrow={t("cook.heroEyebrow")} title={displayTitle} description={serviceLabel} />
        <Card>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("cook.noPlanForMenu")}</p>
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
    : {
        data: [] as Array<{
          id: string;
          course_no: number;
          course_label: string | null;
          dish_name: string;
          plating_notes: string | null;
          decoration_notes: string | null;
          image_path: string | null;
        }>,
      };

  const dishImageUrls = await Promise.all((dishes ?? []).map((dish) => resolveStorageImageUrl({ supabase, path: dish.image_path })));

  const { data: steps } = await supabase
    .from("cook_steps")
    .select("id, step_no, phase, title, details, technique, knife_cut, utensils, dish_name, relative_minutes")
    .eq("cook_plan_id", cookPlan.id)
    .order("relative_minutes", { ascending: true, nullsFirst: true })
    .order("step_no", { ascending: true });

  const sections = [
    {
      id: "overview",
      title: t("cook.overview"),
      content: (
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="section-label">Overview</p>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">{cookPlan.overview ?? t("cook.noOverview")}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="section-label">{t("cook.miseEnPlace")}</p>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">{cookPlan.mise_en_place ?? t("cook.noMise")}</p>
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
              <div key={step.id} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="accent">
                    {step.relative_minutes !== null ? `T${step.relative_minutes >= 0 ? "+" : ""}${step.relative_minutes} min` : `${t("cook.step")} ${step.step_no}`}
                  </Badge>
                  <Badge variant="default" className="normal-case tracking-[0.08em]">{step.phase}</Badge>
                  {step.dish_name ? <Badge variant="success" className="normal-case tracking-[0.08em]">{t("cook.dish")}: {step.dish_name}</Badge> : null}
                </div>
                <p className="text-lg font-semibold text-card-foreground">{step.title}</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {detailPoints.map((line) => (
                    <li key={`${step.id}-${line}`} className="flex items-start gap-2 leading-relaxed">
                      <CookingPot size={14} className="mt-0.5 shrink-0 text-primary" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="section-label">Technique</p>
                    <p className="mt-2 text-sm text-card-foreground">{step.technique}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="section-label">Knife cut</p>
                    <p className="mt-2 text-sm text-card-foreground">{step.knife_cut ?? "Not specified"}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="section-label">Tools</p>
                    <p className="mt-2 text-sm text-card-foreground">{(step.utensils ?? []).join(", ") || "Chef knife"}</p>
                  </div>
                </div>
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
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="section-label">{t("approval.detail.platingOverview", "Plating overview")}</p>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">{cookPlan.plating_overview ?? t("cook.noPlating")}</p>
          </div>
          {(dishes ?? []).map((dish, index) => (
            <div key={dish.id} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  {dishImageUrls[index] ? (
                    <img src={dishImageUrls[index] ?? undefined} alt={dish.dish_name} className="h-48 w-full rounded-[1.3rem] border border-white/10 object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-[1.3rem] border border-white/10 bg-white/[0.03] text-sm text-muted-foreground">
                      No plating image available
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="section-label">{dish.course_label ?? `${t("approval.detail.course", "Course")} ${dish.course_no}`}</p>
                    <p className="mt-1 text-xl font-semibold text-card-foreground">{dish.dish_name}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="section-label">{t("approval.detail.plating", "Plating")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-card-foreground">{dish.plating_notes ?? t("approval.detail.noPlatingNotes", "No plating notes")}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="section-label">{t("approval.detail.decoration", "Decoration")}</p>
                    <p className="mt-2 text-sm leading-relaxed text-card-foreground">{dish.decoration_notes ?? t("approval.detail.noDecorationNotes", "No decoration notes")}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "service",
      title: t("cook.serviceNotes"),
      content: (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="section-label">{t("cook.serviceNotes")}</p>
          <p className="mt-2 text-sm leading-relaxed text-card-foreground">{cookPlan.service_notes ?? t("cook.noServiceNotes")}</p>
        </div>
      ),
    },
  ];

  return (
    <PageTransition>
      <PageHero eyebrow={t("cook.heroEyebrow")} title={displayTitle} description={serviceLabel} />

      <Card variant="glass" className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="section-label">{t("cook.timeline")}</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <Clock3 size={16} className="text-primary" />
            {steps?.length ?? 0} steps
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="section-label">{t("cook.plating")}</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <Sparkles size={16} className="text-primary" />
            {dishes?.length ?? 0} dishes
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="section-label">{t("common.table.service", "Service")}</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-card-foreground">
            <CalendarClock size={16} className="text-primary" />
            {serviceLabel}
          </p>
        </div>
      </Card>

      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <Clock3 size={14} />
        {t("cook.timeline")}
      </div>
      <CollapsibleSections sections={sections} defaultOpen={["overview", "timeline"]} />
    </PageTransition>
  );
}

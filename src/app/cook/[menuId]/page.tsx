/* eslint-disable @next/next/no-img-element */

import { notFound } from "next/navigation";
import { AlertTriangle, CalendarClock, ChefHat, Clock3, CookingPot, Flame, Sparkles } from "lucide-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Card } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveMenuDisplayTitle } from "@/lib/menu-display";
import { CollapsibleSections } from "@/components/ui/collapsible-section";
import { formatWithLocale, getServerLocale, getServerT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { resolveStorageImageUrl } from "@/lib/menu-images";
import { parseCookStepDetails } from "@/lib/cook-plan";
import { localizeCookPlan, localizeCookSteps, localizeDishRows, localizeDisplayTitle } from "@/lib/menu-localization";
import { ensureRestrictionSafeMenuArtifacts } from "@/lib/menu-safety-repair";

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

  await ensureRestrictionSafeMenuArtifacts(menu.id);

  const { data: cookPlan } = await supabase
    .from("cook_plans")
    .select("id, overview, mise_en_place, plating_overview, service_notes")
    .eq("menu_id", menuId)
    .maybeSingle();

  const approvedOption = (menu.menu_options ?? []).find((option) => option.id === menu.approved_option_id) ?? null;
  const displayTitle = await localizeDisplayTitle(locale, resolveMenuDisplayTitle(menu, approvedOption));
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
        .select("id, course_no, course_label, dish_name, description, plating_notes, decoration_notes, image_path")
        .eq("menu_option_id", menu.approved_option_id)
        .order("course_no", { ascending: true })
    : {
        data: [] as Array<{
          id: string;
          course_no: number;
          course_label: string | null;
          dish_name: string;
          description: string;
          plating_notes: string | null;
          decoration_notes: string | null;
          image_path: string | null;
        }>,
      };

  const localizedDishes = await localizeDishRows(dishes ?? [], locale);
  const dishImageUrls = await Promise.all((dishes ?? []).map((dish) => resolveStorageImageUrl({ supabase, path: dish.image_path })));

  const { data: steps } = await supabase
    .from("cook_steps")
    .select("id, step_no, phase, title, details, technique, knife_cut, utensils, dish_name, relative_minutes")
    .eq("cook_plan_id", cookPlan.id)
    .order("relative_minutes", { ascending: true, nullsFirst: true })
    .order("step_no", { ascending: true });

  const [localizedCookPlan, localizedSteps] = await Promise.all([
    localizeCookPlan(cookPlan, locale),
    localizeCookSteps(steps ?? [], locale),
  ]);

  const sections = [
    {
      id: "overview",
      title: t("cook.overview"),
      content: (
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="section-label">{t("cook.overview", "Overview")}</p>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">{localizedCookPlan?.overview ?? t("cook.noOverview")}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <p className="section-label">{t("cook.miseEnPlace")}</p>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">{localizedCookPlan?.mise_en_place ?? t("cook.noMise")}</p>
          </div>
        </div>
      ),
    },
    {
      id: "timeline",
      title: t("cook.timeline"),
      content: (
        <div className="space-y-3">
          {(localizedSteps ?? []).map((step) => {
            const parsedDetails = parseCookStepDetails(step.details);
            const detailMap = new Map(parsedDetails.map((detail) => [detail.key, detail.value]));
            const supportingNotes = parsedDetails.filter((detail) => !["action", "ingredients", "duration", "heat", "visualCue", "avoid", "chefTip", "holdStorage", "technique", "knifeCut", "tools"].includes(detail.key));
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
                {detailMap.get("action") ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{detailMap.get("action")}</p>
                ) : null}
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {detailMap.get("ingredients") ? (
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3 md:col-span-2 xl:col-span-3">
                      <p className="section-label">{t("cook.ingredients", "Ingredients & amounts")}</p>
                      <p className="mt-2 text-sm leading-relaxed text-card-foreground">{detailMap.get("ingredients")}</p>
                    </div>
                  ) : null}
                  {detailMap.get("duration") ? (
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                      <p className="section-label">{t("cook.duration", "Duration")}</p>
                      <p className="mt-2 text-sm text-card-foreground">{detailMap.get("duration")}</p>
                    </div>
                  ) : null}
                  {detailMap.get("heat") ? (
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                      <p className="section-label">{t("cook.heat", "Heat")}</p>
                      <p className="mt-2 flex items-start gap-2 text-sm text-card-foreground">
                        <Flame size={14} className="mt-0.5 shrink-0 text-primary" />
                        <span>{detailMap.get("heat")}</span>
                      </p>
                    </div>
                  ) : null}
                  {detailMap.get("visualCue") ? (
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                      <p className="section-label">{t("cook.visualCue", "Visual cue")}</p>
                      <p className="mt-2 text-sm text-card-foreground">{detailMap.get("visualCue")}</p>
                    </div>
                  ) : null}
                  {detailMap.get("avoid") ? (
                    <div className="rounded-[1.2rem] border border-warning/30 bg-warning/10 p-3">
                      <p className="section-label">{t("cook.warning", "Warning")}</p>
                      <p className="mt-2 flex items-start gap-2 text-sm text-card-foreground">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" />
                        <span>{detailMap.get("avoid")}</span>
                      </p>
                    </div>
                  ) : null}
                  {detailMap.get("chefTip") ? (
                    <div className="rounded-[1.2rem] border border-primary/20 bg-primary/10 p-3">
                      <p className="section-label">{t("cook.chefTip", "Chef tip")}</p>
                      <p className="mt-2 flex items-start gap-2 text-sm text-card-foreground">
                        <ChefHat size={14} className="mt-0.5 shrink-0 text-primary" />
                        <span>{detailMap.get("chefTip")}</span>
                      </p>
                    </div>
                  ) : null}
                  {detailMap.get("holdStorage") ? (
                    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3 md:col-span-2 xl:col-span-3">
                      <p className="section-label">{t("cook.holdStorage", "Hold/storage")}</p>
                      <p className="mt-2 text-sm text-card-foreground">{detailMap.get("holdStorage")}</p>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="section-label">{t("cook.technique", "Technique")}</p>
                    <p className="mt-2 text-sm text-card-foreground">{step.technique}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="section-label">{t("cook.knifeCut", "Knife cut")}</p>
                    <p className="mt-2 text-sm text-card-foreground">{step.knife_cut ?? t("common.notSpecified", "Not specified")}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                    <p className="section-label">{t("cook.tools", "Tools")}</p>
                    <p className="mt-2 text-sm text-card-foreground">{(step.utensils ?? []).join(", ") || t("cook.defaultTool", "Chef knife")}</p>
                  </div>
                </div>
                {supportingNotes.length ? (
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {supportingNotes.map((detail) => (
                      <li key={`${step.id}-${detail.label}-${detail.value}`} className="flex items-start gap-2 leading-relaxed">
                        <CookingPot size={14} className="mt-0.5 shrink-0 text-primary" />
                        <span><strong>{detail.label}:</strong> {detail.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
          {!localizedSteps?.length ? <p className="text-sm text-muted-foreground">{t("cook.noSteps")}</p> : null}
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
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">{localizedCookPlan?.plating_overview ?? t("cook.noPlating")}</p>
          </div>
          {(localizedDishes ?? []).map((dish, index) => (
            <div key={dish.id} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  {dishImageUrls[index] ? (
                    <img src={dishImageUrls[index] ?? undefined} alt={dish.dish_name} className="h-48 w-full rounded-[1.3rem] border border-white/10 object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-[1.3rem] border border-white/10 bg-white/[0.03] text-sm text-muted-foreground">
                      {t("cook.noPlatingImage", "No plating image available")}
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
          <p className="mt-2 text-sm leading-relaxed text-card-foreground">{localizedCookPlan?.service_notes ?? t("cook.noServiceNotes")}</p>
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
            {localizedSteps?.length ?? 0} {t("cook.stepsLabel", "steps")}
          </p>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="section-label">{t("cook.plating")}</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <Sparkles size={16} className="text-primary" />
            {localizedDishes?.length ?? 0} {t("approval.detail.dishes", "dishes").toLowerCase()}
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

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
import type { CookStepExecutionDetails } from "@/types/domain";

function splitDetailPoints(details: string) {
  return details
    .split(/\n|•|\-/g)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

type ParsedStepDetail = {
  label: string | null;
  text: string;
};

function parseStepDetails(details: string, t: (key: string, fallback?: string) => string): ParsedStepDetail[] {
  const lines = splitDetailPoints(details);
  return lines.map((line) => {
    const patterns: Array<{ regex: RegExp; label: string }> = [
      { regex: /^(objective|objetivo)\s*[:：-]\s*/i, label: t("cook.execution.objective", "Objective") },
      { regex: /^(ingredients?|ingredientes?)\s*[:：-]\s*/i, label: t("cook.execution.ingredients", "Ingredients") },
      { regex: /^(actions?|method|steps?)\s*[:：-]\s*/i, label: t("cook.execution.action", "Action") },
      { regex: /^(tools?|utensils?|equipment)\s*[:：-]\s*/i, label: t("cook.execution.tools", "Tools") },
      { regex: /^(duration|time)\s*[:：-]\s*/i, label: t("cook.execution.duration", "Duration") },
      { regex: /^(heat|temperature)\s*[:：-]\s*/i, label: t("cook.execution.heatControl", "Heat Control") },
      { regex: /^(consistency|texture)\s*[:：-]\s*/i, label: t("cook.execution.consistency", "Consistency Target") },
      { regex: /^(mistakes?|warnings?|warning)\s*[:：-]\s*/i, label: t("cook.execution.mistakes", "Common Mistakes") },
      { regex: /^(plating|plate|presentation)\s*[:：-]\s*/i, label: t("cook.execution.platingNote", "Plating Note") },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        return {
          label: pattern.label,
          text: line.replace(pattern.regex, "").trim() || line,
        };
      }
    }

    return { label: null, text: line };
  });
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value))));
}

function resolveExecutionDetails(
  step: { technique: string | null; knife_cut: string | null; utensils: string[] | null },
  parsedDetailLines: ParsedStepDetail[],
  t: (key: string, fallback?: string) => string,
): CookStepExecutionDetails {
  const techniques = unique([
    step.technique,
    step.knife_cut ? `${t("cook.execution.cutType", "Cut Type")}: ${step.knife_cut}` : null,
  ]);

  const utensils = unique(step.utensils ?? []);

  const preparationCues = unique(
    parsedDetailLines
      .filter((line) => Boolean(line.label))
      .map((line) => (line.label ? `${line.label}: ${line.text}` : line.text)),
  );

  return {
    techniques: techniques.length ? techniques : undefined,
    utensils: utensils.length ? utensils : undefined,
    preparationCues: preparationCues.length ? preparationCues : undefined,
  };
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
  const displayTitle = resolveMenuDisplayTitle(menu, approvedOption, t("common.untitledMenu", "Untitled menu"));

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
    .select("id, step_no, phase, title, details, technique, knife_cut, utensils, dish_name, relative_minutes")
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
            const detailLines = parseStepDetails(step.details, t);
            const executionDetails = resolveExecutionDetails(step, detailLines, t);
            const hasExecutionDetails = Boolean(
              executionDetails.techniques?.length || executionDetails.utensils?.length || executionDetails.preparationCues?.length,
            );

            return (
              <div key={step.id} className="rounded-xl border border-border/60 bg-card/70 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="accent" className="text-accent-foreground">
                    {step.relative_minutes !== null ? `T${step.relative_minutes >= 0 ? "+" : ""}${step.relative_minutes} min` : `${t("cook.step")} ${step.step_no}`}
                  </Badge>
                  <Badge variant="default" className="text-card-foreground">{step.phase}</Badge>
                  {step.dish_name ? <Badge variant="success" className="text-success">{t("cook.dish")}: {step.dish_name}</Badge> : null}
                </div>
                <p className="font-medium text-card-foreground">{step.title}</p>
                <ul className="mt-2 space-y-1.5 text-sm text-card-foreground/90">
                  {detailLines.map((line) => (
                    <li key={`${step.id}-${line.label ?? "detail"}-${line.text}`} className="flex items-start gap-2">
                      <CookingPot size={14} className="mt-0.5 shrink-0 text-primary" />
                      <span>
                        {line.label ? <strong className="text-card-foreground">{line.label}:</strong> : null}
                        {line.label ? " " : ""}
                        {line.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {hasExecutionDetails ? (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-card-foreground/70">{t("cook.execution.title", "Execution Details")}</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {executionDetails.techniques?.length ? (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-card-foreground/75">{t("cook.execution.techniques", "Techniques")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {executionDetails.techniques.map((technique) => (
                              <span key={`${step.id}-tech-${technique}`} className="rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                {technique}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {executionDetails.utensils?.length ? (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-card-foreground/75">{t("cook.execution.utensils", "Utensils & Equipment")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {executionDetails.utensils.map((utensil) => (
                              <span key={`${step.id}-utensil-${utensil}`} className="rounded-full border border-border/70 bg-card px-2.5 py-1 text-xs text-card-foreground/90">
                                {utensil}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {executionDetails.preparationCues?.length ? (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-card-foreground/75">{t("cook.execution.notes", "Execution Notes")}</p>
                          <ul className="space-y-1 text-xs text-card-foreground/85">
                            {executionDetails.preparationCues.map((cue) => (
                              <li key={`${step.id}-cue-${cue}`}>{cue}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
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
          <p className="text-sm text-card-foreground/90">{cookPlan.plating_overview ?? t("cook.noPlating")}</p>
          {(dishes ?? []).map((dish, index) => (
            <div key={dish.id} className="rounded-xl border border-border/60 bg-card/70 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-card-foreground/70">{dish.course_label ?? `${t("approval.detail.course", "Course")} ${dish.course_no}`}</p>
              <p className="font-medium text-card-foreground">{dish.dish_name}</p>
              <p className="text-sm text-card-foreground/90">{dish.plating_notes ?? t("approval.detail.noPlatingNotes", "No plating notes")}</p>
              <p className="text-xs text-card-foreground/80">{dish.decoration_notes ?? t("approval.detail.noDecorationNotes", "No decoration notes")}</p>
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
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground/85"><Clock3 size={14} />{t("cook.timeline")}</div>
      <CollapsibleSections sections={sections} defaultOpen={["overview", "timeline"]} />
    </PageTransition>
  );
}

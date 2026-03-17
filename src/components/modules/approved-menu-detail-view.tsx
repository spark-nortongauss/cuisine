/* eslint-disable @next/next/no-img-element */

"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, ChefHat, Clock3, CookingPot, Eye, Flame, ImageIcon, ListChecks, Loader2, RefreshCw, ShieldCheck, Sparkles, Timer, UtensilsCrossed, Wine } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { DownloadMenuPdfButton } from "@/components/modules/download-menu-pdf-button";
import { FavoriteMenuButton } from "@/components/modules/favorite-menu-button";
import { ShoppingListButton } from "@/components/modules/shopping-list-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImageLightbox, type LightboxItem } from "@/components/ui/image-lightbox";
import { parseCookStepDetails } from "@/lib/cook-plan";
import { resolveOptionDisplayTitle } from "@/lib/menu-display";
import { cn } from "@/lib/utils";
import { formatRestrictionComplianceLabel, formatRestrictionLabel, getRestrictionBadgeVariant } from "@/lib/menu-restrictions";

type ApprovedMenuDetailViewProps = {
  menu: {
    id: string;
    meal_type: string | null;
    serve_at: string | null;
    invitee_count: number | null;
    restrictions: string[] | null;
    notes: string | null;
    status: string;
  };
  approvedOption: {
    id: string;
    title: string | null;
    michelin_name: string | null;
    concept_summary: string | null;
    concept: string | null;
    chef_notes: string | null;
    beverage_pairing: string | null;
  } | null;
  dishes: Array<{
    id: string;
    course_no: number;
    course_label: string | null;
    dish_name: string;
    description: string;
    plating_notes: string | null;
    decoration_notes: string | null;
    imageUrl: string | null;
  }>;
  heroImageUrl: string | null;
  cookPlan: {
    overview: string | null;
    mise_en_place: string | null;
    plating_overview: string | null;
    service_notes: string | null;
  } | null;
  cookSteps: Array<{
    id: string;
    step_no: number;
    phase: string;
    title: string;
    details: string;
    dish_name: string | null;
  }>;
  dishCompliance: Array<{
    dishId: string;
    checks: Array<{
      restriction: string;
      restrictionKey: string;
      category: string;
      compliant: boolean;
    }>;
  }>;
  favorite: boolean;
  shoppingItemCount: number;
  hasShoppingList: boolean;
};

function buildPreviewItems(
  heroImageUrl: string | null,
  approvedOptionTitle: string,
  dishes: ApprovedMenuDetailViewProps["dishes"],
  heroLabel: string,
  courseLabel: string,
): LightboxItem[] {
  return [
    ...(heroImageUrl
      ? [
          {
            src: heroImageUrl,
            alt: approvedOptionTitle,
            title: approvedOptionTitle,
            subtitle: heroLabel,
            filename: "approved-menu-hero.jpg",
          },
        ]
      : []),
    ...dishes
      .filter((dish) => dish.imageUrl)
      .map((dish, index) => ({
        src: dish.imageUrl as string,
        alt: dish.dish_name,
        title: dish.dish_name,
        subtitle: dish.course_label ?? `${courseLabel} ${dish.course_no}`,
        filename: `approved-dish-${index + 1}.jpg`,
      })),
  ];
}

function normalizeCookStepDetailsForApproval(details: string) {
  return details
    .replace(/\s+/g, " ")
    .replace(
      /\s+(?=(Action|Objective|Ingredients\s*&\s*amounts|Ingredients|Duration|Heat|Temperature|Tools|Cookware|Technique|Knife cut|Prep|Visual cue|Cue|Doneness|Avoid|Warning|Common mistake|Chef tip|Pro tip|Tip|Hold\/storage|Hold|Storage|Make-ahead):)/gi,
      "\n",
    )
    .trim();
}

export function ApprovedMenuDetailView({
  menu,
  approvedOption,
  dishes,
  heroImageUrl,
  cookPlan,
  cookSteps,
  dishCompliance,
  favorite,
  shoppingItemCount,
  hasShoppingList,
}: ApprovedMenuDetailViewProps) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [previewItems, setPreviewItems] = useState<LightboxItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [visualGenerationAttempted, setVisualGenerationAttempted] = useState(false);
  const [visualGenerationState, setVisualGenerationState] = useState<"idle" | "loading" | "error">("idle");
  const [visualGenerationMessage, setVisualGenerationMessage] = useState<string | null>(null);
  const [activeCookStepIndex, setActiveCookStepIndex] = useState(0);

  const approvedOptionTitle = resolveOptionDisplayTitle(approvedOption) ?? t("approval.detail.approvedOption", "Approved option");
  const serviceLabel = menu.serve_at
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at))
    : t("common.noDate", "No date");
  const courseCountLabel = `${dishes.length} ${dishes.length === 1 ? t("generate.form.courseSingle", "course") : t("generate.form.courses", "courses")}`;
  const statusLabel = menu.status === "validated"
    ? t("approval.stats.validated", "Validated")
    : menu.status === "approved"
      ? t("approval.stats.approved", "Approved")
      : menu.status;

  const allPreviewItems = useMemo(
    () => buildPreviewItems(heroImageUrl, approvedOptionTitle, dishes, t("approval.detail.menuHero", "Menu hero"), t("approval.detail.course", "Course")),
    [approvedOptionTitle, dishes, heroImageUrl, t],
  );
  const complianceByDish = useMemo(() => new Map(dishCompliance.map((entry) => [entry.dishId, entry.checks])), [dishCompliance]);
  const visualsReady = Boolean(heroImageUrl) && dishes.every((dish) => Boolean(dish.imageUrl));
  const activeCookStep = cookSteps[activeCookStepIndex] ?? null;
  const activeCookStepDetails = useMemo(
    () => (activeCookStep ? parseCookStepDetails(normalizeCookStepDetailsForApproval(activeCookStep.details)) : []),
    [activeCookStep],
  );
  const activeCookStepDetailMap = useMemo(() => new Map(activeCookStepDetails.map((detail) => [detail.key, detail.value])), [activeCookStepDetails]);
  const activeCookSupportingNotes = useMemo(
    () => activeCookStepDetails.filter((detail) => !["action", "ingredients", "duration", "heat", "visualCue", "avoid", "chefTip", "holdStorage", "technique", "knifeCut", "tools"].includes(detail.key)),
    [activeCookStepDetails],
  );

  function openPreview(index: number) {
    setPreviewItems(allPreviewItems);
    setPreviewIndex(index);
    setPreviewOpen(true);
  }

  const generateApprovalVisuals = useCallback(async () => {
    if (!approvedOption?.id) return;

    setVisualGenerationAttempted(true);
    setVisualGenerationState("loading");
    setVisualGenerationMessage(null);

    try {
      const response = await fetch("/api/generate-menu-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menuId: menu.id,
          prioritizedOptionId: approvedOption.id,
          locale,
          includeOptions: false,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { success?: boolean; error?: string } | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? "Visual generation failed.");
      }

      setVisualGenerationState("idle");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setVisualGenerationState("error");
      setVisualGenerationMessage(
        error instanceof Error
          ? error.message
          : t("approval.detail.visualsFailed", "Visual generation failed. Please try again."),
      );
    }
  }, [approvedOption?.id, locale, menu.id, router, t]);

  useEffect(() => {
    if (visualsReady) {
      setVisualGenerationAttempted(false);
      setVisualGenerationState("idle");
      setVisualGenerationMessage(null);
      return;
    }

    if (!approvedOption?.id || visualGenerationState !== "idle" || visualGenerationAttempted) return;
    void generateApprovalVisuals();
  }, [approvedOption?.id, generateApprovalVisuals, visualGenerationAttempted, visualsReady, visualGenerationState]);

  useEffect(() => {
    if (activeCookStepIndex <= cookSteps.length - 1) return;
    setActiveCookStepIndex(Math.max(cookSteps.length - 1, 0));
  }, [activeCookStepIndex, cookSteps.length]);

  return (
    <>
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">{t("approval.detail.menuMetadata", "Menu metadata")}</p>
                <h2 className="mt-2 font-serif text-3xl">{t("approval.detail.selectedOption", "Selected option")}</h2>
              </div>
              <Badge variant={menu.status === "validated" ? "success" : "accent"}>{statusLabel}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("approval.status", "Status")}</p>
                <p className="mt-2 text-lg font-semibold text-card-foreground">{statusLabel}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("approval.invitees", "Invitees")}</p>
                <p className="mt-2 text-lg font-semibold text-card-foreground">{menu.invitee_count ?? "-"}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("common.table.service", "Service")}</p>
                <p className="mt-2 text-sm leading-relaxed text-card-foreground">{serviceLabel}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("common.table.meal", "Meal")}</p>
                <p className="mt-2 text-lg font-semibold text-card-foreground">{menu.meal_type ?? t("common.mealFallback", "Service")}</p>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="section-label">{t("approval.detail.restrictions", "Restrictions")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {menu.restrictions?.length ? (
                  menu.restrictions.map((restriction) => (
                    <Badge key={restriction} variant="default" className="tracking-[0.08em] normal-case">
                      {formatRestrictionLabel(t, restriction)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("approval.detail.none", "None")}</p>
                )}
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="section-label">{t("approval.detail.chefNotes", "Chef notes")}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {menu.notes ?? t("approval.detail.noChefNotes", "No chef notes")}
              </p>
            </div>
          </Card>

          <Card variant="feature" className="space-y-5 overflow-hidden">
            {heroImageUrl ? (
              <button
                type="button"
                onClick={() => openPreview(0)}
                className="group block overflow-hidden rounded-[1.6rem] text-left"
                aria-label={t("approval.detail.menuHero", "Menu hero")}
              >
                <img
                  src={heroImageUrl}
                  alt={t("approval.detail.menuHero", "Menu hero")}
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              </button>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-[1.6rem] border border-white/10 bg-white/[0.04] px-6 text-center text-sm text-muted-foreground">
                {visualGenerationState === "loading" ? <Loader2 size={18} className="animate-spin text-primary" /> : <ImageIcon size={18} className="text-primary" />}
                <div className="space-y-1">
                  <p className="font-medium text-card-foreground">
                    {visualGenerationState === "loading"
                      ? t("approval.detail.visualsGenerating", "Generating visuals")
                      : t("approval.detail.heroUnavailable", "Hero image unavailable")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {visualGenerationState === "loading"
                      ? t("approval.detail.visualsGeneratingText", "Hero and dish visuals are being generated for this approved menu.")
                      : visualGenerationMessage
                        ?? (visualGenerationAttempted
                          ? t("approval.detail.visualsFailed", "Visual generation failed. Please try again.")
                          : t("approval.detail.visualsPendingText", "Visuals for this approved menu are not ready yet."))}
                  </p>
                </div>
                {visualGenerationState !== "loading" ? (
                  <Button type="button" variant="outline" onClick={() => void generateApprovalVisuals()}>
                    <RefreshCw size={14} />
                    {visualGenerationAttempted
                      ? t("approval.detail.visualsRetry", "Retry visuals")
                      : t("approval.detail.visualsGenerate", "Generate visuals")}
                  </Button>
                ) : null}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="section-label">{t("approval.detail.selectedOption", "Selected option")}</p>
                  <h2 className="font-serif text-3xl leading-tight">{approvedOptionTitle}</h2>
                </div>
                <Badge variant="success">{hasShoppingList ? t("approval.detail.operationalBriefActive", "Operational brief active") : t("approval.stats.approved", "Approved")}</Badge>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                {approvedOption?.concept_summary ?? approvedOption?.concept ?? t("approval.detail.noConceptSummary", "No concept summary.")}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <Wine size={14} className="text-primary" />
                    {t("approval.detail.beveragePairing", "Beverage pairing")}
                  </p>
                  <p className="text-sm leading-relaxed text-card-foreground">
                    {approvedOption?.beverage_pairing ?? t("approval.detail.notSpecified", "Not specified")}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <ChefHat size={14} className="text-primary" />
                    {t("approval.detail.optionChefNotes", "Option chef notes")}
                  </p>
                  <p className="text-sm leading-relaxed text-card-foreground">
                    {approvedOption?.chef_notes ?? t("approval.detail.noOptionNotes", "No option notes")}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <FavoriteMenuButton menuId={menu.id} initialFavorited={favorite} showLabel />
                <ShoppingListButton menuId={menu.id} showLabel />
                <DownloadMenuPdfButton menuId={menu.id} showLabel />
              </div>
            </div>
          </Card>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-label">{t("approval.detail.dishes", "Dishes")}</p>
              <h2 className="mt-2 font-serif text-3xl">{t("approval.detail.dishes", "Dishes")}</h2>
            </div>
            <Badge variant="accent">{courseCountLabel}</Badge>
          </div>

          {dishes.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {dishes.map((dish, index) => {
                const previewIndex = heroImageUrl ? index + 1 : index;
                return (
                  <div key={dish.id} className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                    {dish.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => openPreview(previewIndex)}
                        className="group block w-full text-left"
                        aria-label={`Preview ${dish.dish_name}`}
                      >
                        <img
                          src={dish.imageUrl}
                          alt={dish.dish_name}
                          className="mb-3 h-44 w-full rounded-[1.2rem] object-cover transition duration-300 group-hover:scale-[1.01]"
                        />
                      </button>
                    ) : (
                      <div className="mb-3 flex h-44 w-full flex-col items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 text-center text-xs text-muted-foreground">
                        {visualGenerationState === "loading" ? <Loader2 size={16} className="animate-spin text-primary" /> : <ImageIcon size={16} className="text-primary" />}
                        <p>
                          {visualGenerationState === "loading"
                            ? t("approval.detail.visualsGenerating", "Generating visuals")
                            : t("approval.detail.heroUnavailable", "Hero image unavailable")}
                        </p>
                      </div>
                    )}
                    <p className="section-label">{dish.course_label ?? `${t("approval.detail.course", "Course")} ${dish.course_no}`}</p>
                    <p className="mt-1 text-xl font-semibold text-card-foreground">{dish.dish_name}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dish.description}</p>
                    {menu.restrictions?.length ? (
                      <div className="mt-4 rounded-[1.1rem] border border-white/10 bg-white/[0.03] p-3">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          <ShieldCheck size={14} className="text-primary" />
                          {t("approval.detail.restrictionsConsidered", "Restrictions considered")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(complianceByDish.get(dish.id) ?? []).map((check) => (
                            <Badge
                              key={`${dish.id}-${check.restriction}`}
                              variant={check.compliant ? getRestrictionBadgeVariant(check.restriction) : "danger"}
                              className="normal-case tracking-[0.06em]"
                            >
                              <CheckCircle2 size={12} />
                              {check.compliant ? formatRestrictionComplianceLabel(t, check.restriction) : formatRestrictionLabel(t, check.restriction)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] p-3">
                        <p className="section-label">{t("approval.detail.plating", "Plating")}</p>
                        <p className="mt-2 text-sm leading-relaxed text-card-foreground">
                          {dish.plating_notes ?? t("approval.detail.noPlatingNotes", "No plating notes")}
                        </p>
                      </div>
                      <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] p-3">
                        <p className="section-label">{t("approval.detail.decoration", "Decoration")}</p>
                        <p className="mt-2 text-sm leading-relaxed text-card-foreground">
                          {dish.decoration_notes ?? t("approval.detail.noDecorationNotes", "No decoration notes")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("approval.detail.noDishes", "No dishes available for the approved option.")}</p>
          )}
        </Card>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">{t("approval.detail.cookingGuidance", "Cooking guidance")}</p>
                <h2 className="mt-2 font-serif text-3xl">{t("approval.detail.cookingGuidance", "Cooking guidance")}</h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
                <Timer size={18} />
              </span>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("cook.overview", "Overview")}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {cookPlan?.overview ?? t("approval.detail.noCookOverview", "No cook overview yet.")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("cook.miseEnPlace", "Mise en place")}</p>
                <p className="mt-2 text-sm leading-relaxed text-card-foreground">
                  {cookPlan?.mise_en_place ?? t("approval.detail.notGenerated", "Not generated")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("approval.detail.platingOverview", "Plating overview")}</p>
                <p className="mt-2 text-sm leading-relaxed text-card-foreground">
                  {cookPlan?.plating_overview ?? t("approval.detail.notGenerated", "Not generated")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("cook.serviceNotes", "Service notes")}</p>
                <p className="mt-2 text-sm leading-relaxed text-card-foreground">
                  {cookPlan?.service_notes ?? t("approval.detail.notGenerated", "Not generated")}
                </p>
              </div>
            </div>

            {activeCookStep ? (
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="section-label">{t("approval.detail.stepNavigation", "Step navigation")}</p>
                      <h3 className="mt-2 font-serif text-2xl">
                        {t("approval.detail.stepCounter", "Step")} {activeCookStep.step_no}
                      </h3>
                    </div>
                    <Badge variant="accent">
                      {activeCookStepIndex + 1} / {cookSteps.length}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {cookSteps.map((step, index) => (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setActiveCookStepIndex(index)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                          index === activeCookStepIndex
                            ? "border-primary/30 bg-primary/15 text-primary"
                            : "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-card-foreground",
                        )}
                      >
                        {step.step_no}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(232,194,117,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))]">
                  <div className="border-b border-white/10 bg-black/10 px-5 py-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="accent">#{activeCookStep.step_no}</Badge>
                      <Badge variant="default" className="normal-case tracking-[0.08em]">{activeCookStep.phase}</Badge>
                      {activeCookStep.dish_name ? <Badge variant="success" className="normal-case tracking-[0.08em]">{activeCookStep.dish_name}</Badge> : null}
                    </div>
                    <p className="mt-4 font-serif text-[2rem] leading-tight text-card-foreground">{activeCookStep.title}</p>
                    {activeCookStepDetailMap.get("action") ? (
                      <div className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.05] p-4">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          <CookingPot size={14} className="text-primary" />
                          {t("cook.objective", "Objective")}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("action")}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4 px-5 py-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {activeCookStepDetailMap.get("ingredients") ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 md:col-span-2 xl:col-span-3">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <CookingPot size={14} className="text-primary" />
                            {t("cook.ingredients", "Ingredients & amounts")}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("ingredients")}</p>
                        </div>
                      ) : null}

                      {activeCookStepDetailMap.get("duration") ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <Clock3 size={14} className="text-primary" />
                            {t("cook.duration", "Duration")}
                          </p>
                          <p className="mt-3 text-sm font-medium text-card-foreground">{activeCookStepDetailMap.get("duration")}</p>
                        </div>
                      ) : null}

                      {activeCookStepDetailMap.get("heat") ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <Flame size={14} className="text-primary" />
                            {t("cook.heat", "Heat")}
                          </p>
                          <p className="mt-3 text-sm font-medium text-card-foreground">{activeCookStepDetailMap.get("heat")}</p>
                        </div>
                      ) : null}

                      {activeCookStepDetailMap.get("visualCue") ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <Eye size={14} className="text-primary" />
                            {t("cook.visualCue", "Visual cue")}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("visualCue")}</p>
                        </div>
                      ) : null}

                      {activeCookStepDetailMap.get("tools") ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <UtensilsCrossed size={14} className="text-primary" />
                            {t("cook.tools", "Tools")}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("tools")}</p>
                        </div>
                      ) : null}

                      {activeCookStepDetailMap.get("technique") ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <ChefHat size={14} className="text-primary" />
                            {t("cook.technique", "Technique")}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("technique")}</p>
                        </div>
                      ) : null}

                      {activeCookStepDetailMap.get("knifeCut") ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <Sparkles size={14} className="text-primary" />
                            {t("cook.knifeCut", "Knife cut")}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("knifeCut")}</p>
                        </div>
                      ) : null}

                      {activeCookStepDetailMap.get("holdStorage") ? (
                        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 md:col-span-2 xl:col-span-3">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            <ShieldCheck size={14} className="text-primary" />
                            {t("cook.holdStorage", "Hold/storage")}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("holdStorage")}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      {activeCookStepDetailMap.get("avoid") ? (
                        <div className="rounded-[1.35rem] border border-warning/25 bg-warning/10 p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-warning">
                            <AlertTriangle size={14} />
                            {t("cook.warning", "Warning")}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("avoid")}</p>
                        </div>
                      ) : null}

                      {activeCookStepDetailMap.get("chefTip") ? (
                        <div className="rounded-[1.35rem] border border-primary/25 bg-primary/10 p-4">
                          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary">
                            <ChefHat size={14} />
                            {t("cook.chefTip", "Chef tip")}
                          </p>
                          <p className="mt-3 text-sm leading-relaxed text-card-foreground">{activeCookStepDetailMap.get("chefTip")}</p>
                        </div>
                      ) : null}
                    </div>

                    {activeCookSupportingNotes.length ? (
                      <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4">
                        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          <Sparkles size={14} className="text-primary" />
                          {t("approval.detail.additionalNotes", "Additional notes")}
                        </p>
                        <ul className="mt-3 space-y-2">
                          {activeCookSupportingNotes.map((detail) => (
                            <li key={`${activeCookStep.id}-${detail.label}-${detail.value}`} className="flex items-start gap-2 text-sm leading-relaxed text-card-foreground">
                              <CookingPot size={14} className="mt-0.5 shrink-0 text-primary" />
                              <span><strong>{detail.label}:</strong> {detail.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveCookStepIndex((current) => Math.max(0, current - 1))}
                    disabled={activeCookStepIndex === 0}
                  >
                    <ArrowLeft size={14} />
                    {t("approval.detail.previousStep", "Previous step")}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveCookStepIndex((current) => Math.min(cookSteps.length - 1, current + 1))}
                    disabled={activeCookStepIndex === cookSteps.length - 1}
                  >
                    {t("approval.detail.nextStep", "Next step")}
                    <ArrowRight size={14} />
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">{t("approval.detail.shoppingListStatus", "Shopping list status")}</p>
                <h2 className="mt-2 font-serif text-3xl">{hasShoppingList ? t("approval.detail.operationalChecklist", "Operational checklist active") : t("approval.detail.shoppingNotGenerated", "Shopping not generated yet")}</h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
                <ListChecks size={18} />
              </span>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock size={14} className="text-primary" />
                {t("approval.detail.serviceDate", "Service date")}
              </div>
              <p className="mt-2 text-lg font-semibold text-card-foreground">{serviceLabel}</p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 size={14} className="text-primary" />
                {t("approval.detail.shoppingStatus", "Shopping status")}
              </div>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {hasShoppingList
                  ? `${shoppingItemCount} ${t("approval.detail.itemsPrepared", "items prepared")}`
                  : t("approval.detail.notGeneratedYet", "Not generated yet")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {hasShoppingList
                  ? t("approval.detail.shoppingReadyText", "Open the shopping workspace to review procurement, pricing, and generate the cook timeline.")
                  : t("approval.detail.shoppingPendingText", "Generate the shopping list from the action bar above to move this approved service into kitchen operations.")}
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles size={14} className="text-primary" />
                {t("approval.detail.imagePreviewSupport", "Image preview support")}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("approval.detail.imagePreviewSupportText", "Every approved-menu image now opens into a full preview with zoom, keyboard navigation, download, and sharing support.")}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <ImageLightbox
        items={previewItems}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        activeIndex={previewIndex}
        onActiveIndexChange={setPreviewIndex}
      />
    </>
  );
}

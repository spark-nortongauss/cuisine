/* eslint-disable @next/next/no-img-element */

"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ChefHat, ImageIcon, ListChecks, Sparkles, Timer, Wine } from "lucide-react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { DownloadMenuPdfButton } from "@/components/modules/download-menu-pdf-button";
import { FavoriteMenuButton } from "@/components/modules/favorite-menu-button";
import { ShoppingListButton } from "@/components/modules/shopping-list-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ImageLightbox, type LightboxItem } from "@/components/ui/image-lightbox";
import { resolveOptionDisplayTitle } from "@/lib/menu-display";

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
  favorite: boolean;
  shoppingItemCount: number;
  hasShoppingList: boolean;
};

function buildPreviewItems(heroImageUrl: string | null, approvedOptionTitle: string, dishes: ApprovedMenuDetailViewProps["dishes"]): LightboxItem[] {
  return [
    ...(heroImageUrl
      ? [
          {
            src: heroImageUrl,
            alt: approvedOptionTitle,
            title: approvedOptionTitle,
            subtitle: "Hero image",
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
        subtitle: dish.course_label ?? `Course ${dish.course_no}`,
        filename: `approved-dish-${index + 1}.jpg`,
      })),
  ];
}

export function ApprovedMenuDetailView({
  menu,
  approvedOption,
  dishes,
  heroImageUrl,
  cookPlan,
  cookSteps,
  favorite,
  shoppingItemCount,
  hasShoppingList,
}: ApprovedMenuDetailViewProps) {
  const { locale, t } = useI18n();
  const [previewItems, setPreviewItems] = useState<LightboxItem[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  const approvedOptionTitle = resolveOptionDisplayTitle(approvedOption) ?? t("approval.detail.approvedOption", "Approved option");
  const serviceLabel = menu.serve_at
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(menu.serve_at))
    : t("common.noDate", "No date");
  const courseCountLabel = `${dishes.length} ${dishes.length === 1 ? "course" : "courses"}`;

  const allPreviewItems = useMemo(() => buildPreviewItems(heroImageUrl, approvedOptionTitle, dishes), [approvedOptionTitle, dishes, heroImageUrl]);

  function openPreview(index: number) {
    setPreviewItems(allPreviewItems);
    setPreviewIndex(index);
    setPreviewOpen(true);
  }

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
              <Badge variant={menu.status === "validated" ? "success" : "accent"}>{menu.status}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("approval.status", "Status")}</p>
                <p className="mt-2 text-lg font-semibold capitalize text-card-foreground">{menu.status}</p>
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
                      {restriction}
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
              <div className="flex h-64 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/[0.04] text-sm text-muted-foreground">
                <ImageIcon size={16} className="mr-2 text-primary" />
                Hero image unavailable
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="section-label">{t("approval.detail.selectedOption", "Selected option")}</p>
                  <h2 className="font-serif text-3xl leading-tight">{approvedOptionTitle}</h2>
                </div>
                <Badge variant="success">{hasShoppingList ? "Operational brief active" : "Approved"}</Badge>
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
                    ) : null}
                    <p className="section-label">{dish.course_label ?? `${t("approval.detail.course", "Course")} ${dish.course_no}`}</p>
                    <p className="mt-1 text-xl font-semibold text-card-foreground">{dish.dish_name}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{dish.description}</p>
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
                <p className="section-label">Overview</p>
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

            {cookSteps.length ? (
              <div className="space-y-3">
                {cookSteps.map((step) => (
                  <div key={step.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="accent">#{step.step_no}</Badge>
                      <Badge variant="default" className="normal-case tracking-[0.08em]">{step.phase}</Badge>
                      {step.dish_name ? <Badge variant="success" className="normal-case tracking-[0.08em]">{step.dish_name}</Badge> : null}
                    </div>
                    <p className="mt-3 text-lg font-semibold text-card-foreground">{step.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.details}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">{t("approval.detail.shoppingListStatus", "Shopping list status")}</p>
                <h2 className="mt-2 font-serif text-3xl">{hasShoppingList ? "Operational checklist active" : "Shopping not generated yet"}</h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
                <ListChecks size={18} />
              </span>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock size={14} className="text-primary" />
                Service date
              </div>
              <p className="mt-2 text-lg font-semibold text-card-foreground">{serviceLabel}</p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 size={14} className="text-primary" />
                Shopping status
              </div>
              <p className="mt-2 text-lg font-semibold text-card-foreground">
                {hasShoppingList
                  ? `${shoppingItemCount} ${t("approval.detail.itemsPrepared", "items prepared")}`
                  : t("approval.detail.notGeneratedYet", "Not generated yet")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {hasShoppingList
                  ? "Open the shopping workspace to review procurement, pricing, and generate the cook timeline."
                  : "Generate the shopping list from the action bar above to move this approved service into kitchen operations."}
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
              <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles size={14} className="text-primary" />
                Image preview support
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every approved-menu image now opens into a full preview with zoom, keyboard navigation, download, and sharing support.
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

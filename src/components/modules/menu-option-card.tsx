/* eslint-disable @next/next/no-img-element */

"use client";

import { useMemo, useState } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ImageIcon, Loader2, Sparkles, UtensilsCrossed, Wine } from "lucide-react";
import { MenuOption } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type MenuOptionCardProps = {
  option: MenuOption;
  onSelect?: () => void;
  isSelected?: boolean;
  selecting?: boolean;
};

function resolveClientImageUrl(url?: string | null, path?: string | null) {
  if (url && /^https?:\/\//i.test(url)) return url;
  if (path && /^https?:\/\//i.test(path)) return path;
  return null;
}

function DishImage({ imagePath, imageUrl }: { imagePath?: string | null; imageUrl?: string | null }) {
  const { t } = useI18n();
  const resolvedImage = useMemo(() => resolveClientImageUrl(imageUrl, imagePath), [imagePath, imageUrl]);
  const [hasError, setHasError] = useState(false);

  if (resolvedImage && !hasError) {
    return (
      <img
        src={resolvedImage}
        alt="Dish visual"
        className="h-36 w-full rounded-[1.25rem] object-cover md:h-32 md:w-48"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="flex h-36 w-full items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/[0.04] text-xs text-muted-foreground md:h-32 md:w-48">
      <ImageIcon size={16} className="mr-2 text-primary" />
      {t("generate.card.imagePending", "Image pending")}
    </div>
  );
}

export function MenuOptionCard({ option, onSelect, isSelected = false, selecting = false }: MenuOptionCardProps) {
  const { t } = useI18n();
  const heroImageSrc = useMemo(() => resolveClientImageUrl(option.heroImageUrl, option.heroImagePath), [option.heroImagePath, option.heroImageUrl]);
  const [heroHasError, setHeroHasError] = useState(false);
  const visualsReady = Boolean(option.heroImageUrl) && option.dishes.every((dish) => Boolean(dish.imageUrl));
  const courseCountLabel = `${option.dishes.length} ${option.dishes.length === 1 ? t("generate.form.courseSingle", "course") : t("generate.form.courses", "courses")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
    >
      <Card variant="feature" className={cn("overflow-hidden p-0", isSelected ? "border-success/40 shadow-glow" : "")}>
        <div className="relative">
          {heroImageSrc && !heroHasError ? (
            <img
              src={heroImageSrc}
              alt={`${option.title} hero`}
              className="h-52 w-full object-cover md:h-64"
              loading="lazy"
              onError={() => setHeroHasError(true)}
            />
          ) : (
            <div className="flex h-52 w-full items-end bg-[radial-gradient(circle_at_top_left,rgba(232,194,117,0.18),transparent_30%),linear-gradient(160deg,rgba(26,34,50,0.98),rgba(11,16,29,0.96))] p-5 md:h-64">
              <Badge variant={visualsReady ? "success" : "default"}>
                {visualsReady ? t("generate.card.visualReady", "Visual set ready") : t("generate.card.heroPending", "Hero image pending")}
              </Badge>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" aria-hidden />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge variant={isSelected ? "success" : "accent"}>{isSelected ? t("generate.card.selected", "Selected") : t("generate.card.michelinInspired", "Michelin-inspired")}</Badge>
            <Badge variant="default">{courseCountLabel}</Badge>
          </div>
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="section-label">{t("generate.card.curatedOption", "Curated option")}</p>
              <h3 className="font-serif text-3xl leading-tight md:text-4xl">{option.title}</h3>
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">{option.concept}</p>
            </div>
            <div className="min-w-[12rem] rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
              <p className="section-label">{t("generate.card.readiness", "Readiness")}</p>
              <p className="mt-2 text-sm font-semibold text-card-foreground">
                {visualsReady ? t("generate.card.visualsCompleted", "Visuals completed") : t("generate.card.visualsRunning", "Visual generation still running")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {visualsReady
                  ? t("generate.card.visualsCompletedText", "Use the option card below to review plating details and commit the final selection.")
                  : t("generate.card.visualsRunningText", "Signed image URLs will continue refreshing in the background while you compare options.")}
              </p>
            </div>
          </div>

          <Accordion.Root type="single" collapsible defaultValue="course-0" className="space-y-3">
            {option.dishes.map((dish, index) => (
              <Accordion.Item
                key={`${dish.course}-${dish.name}`}
                value={`course-${index}`}
                className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[0.04]"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between gap-2 px-4 py-4 text-left">
                    <div className="space-y-1">
                      <p className="section-label">{dish.course}</p>
                      <p className="text-base font-semibold text-card-foreground">{dish.name}</p>
                    </div>
                    <ChevronDown className="text-muted-foreground transition group-data-[state=open]:rotate-180" size={16} />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden border-t border-white/8 px-4 pb-4 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="space-y-4 pt-4 text-sm">
                    <DishImage imagePath={dish.imagePath} imageUrl={dish.imageUrl} />
                    <p className="leading-relaxed text-muted-foreground">{dish.description}</p>
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          <UtensilsCrossed size={14} className="text-primary" />
                          {t("approval.detail.plating", "Plating")}
                        </p>
                        <p className="text-sm leading-relaxed text-card-foreground">{dish.platingNotes}</p>
                      </div>
                      <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-3">
                        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          <Wine size={14} className="text-primary" />
                          {t("generate.card.beverage", "Beverage")}
                        </p>
                        <p className="text-sm leading-relaxed text-card-foreground">{dish.beverageSuggestion ?? t("generate.card.noBeverage", "No beverage pairing suggested yet.")}</p>
                      </div>
                    </div>
                    {process.env.NODE_ENV === "development" ? (
                      <p className="text-xs italic text-muted-foreground">{t("generate.card.imagePrompt", "Image prompt")}: {dish.imagePrompt}</p>
                    ) : null}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="space-y-1">
              <p className="section-label">{t("generate.card.decision", "Decision")}</p>
              <p className="text-sm text-muted-foreground">
                {isSelected
                  ? t("generate.card.decisionLocked", "This option is locked as the service direction.")
                  : t("generate.card.decisionHelper", "Choose this option to advance it into approval, shopping, and cook planning.")}
              </p>
            </div>
            <Button variant={isSelected ? "secondary" : "default"} onClick={onSelect} disabled={!onSelect || selecting || isSelected}>
              {selecting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {selecting ? t("generate.card.selecting", "Selecting...") : isSelected ? t("generate.card.selected", "Selected") : t("generate.card.select", "Select option")}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

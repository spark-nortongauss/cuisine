"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ImageIcon, Sparkles, UtensilsCrossed, Wine } from "lucide-react";
import { MenuOption } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";

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

function DishImage({
  imagePath,
  imageUrl,
  t,
}: {
  imagePath?: string | null;
  imageUrl?: string | null;
  t: (key: string, fallback?: string) => string;
}) {
  const resolvedImage = useMemo(() => resolveClientImageUrl(imageUrl, imagePath), [imagePath, imageUrl]);
  const [hasError, setHasError] = useState(false);

  if (resolvedImage && !hasError) {
    return (
      <img
        src={resolvedImage}
        alt={t("generate.option.dishVisual", "Dish visual")}
        className="h-32 w-full rounded-xl object-cover md:h-28 md:w-44"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="flex h-32 w-full items-center justify-center rounded-xl border border-border/70 bg-gradient-to-br from-primary/10 via-card to-accent/15 text-xs text-muted-foreground md:h-28 md:w-44">
      <ImageIcon size={16} className="mr-2" />
      {t("generate.option.imagePending", "Image pending")}
    </div>
  );
}

export function MenuOptionCard({ option, onSelect, isSelected = false, selecting = false }: MenuOptionCardProps) {
  const { t } = useI18n();
  const heroImageSrc = useMemo(() => resolveClientImageUrl(option.heroImageUrl, option.heroImagePath), [option.heroImagePath, option.heroImageUrl]);
  const [heroHasError, setHeroHasError] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} whileHover={{ y: -4 }}>
      <Card variant="feature" className={cn("space-y-5 overflow-hidden border transition", isSelected ? "border-success/60 shadow-glow" : "") }>
        {heroImageSrc && !heroHasError ? (
          <img
            src={heroImageSrc}
            alt={`${option.title} ${t("generate.option.hero", "hero")}`}
            className="h-44 w-full rounded-2xl object-cover md:h-52"
            loading="lazy"
            onError={() => setHeroHasError(true)}
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-r from-primary/10 via-card/90 to-accent/20 text-sm text-muted-foreground md:h-52">
            {t("generate.option.heroPending", "Premium hero image pending")}
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary/80">{t("generate.option.curated", "Curated option")}</p>
            <h3 className="font-serif text-3xl md:text-4xl">{option.title}</h3>
          </div>
          <Badge variant={isSelected ? "success" : "accent"}>
            {isSelected ? t("generate.option.selected", "Selected") : t("generate.option.michelinInspired", "Michelin-inspired")}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground md:text-base">{option.concept}</p>

        <Accordion.Root type="single" collapsible defaultValue="course-0" className="space-y-3">
          {option.dishes.map((dish, index) => (
            <Accordion.Item key={`${dish.course}-${dish.name}`} value={`course-${index}`} className="overflow-hidden rounded-2xl border border-border/70 bg-card/70">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{dish.course}</p>
                    <p className="font-medium">{dish.name}</p>
                  </div>
                  <ChevronDown className="transition group-data-[state=open]:rotate-180" size={16} />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden px-4 pb-4">
                <div className="space-y-3 border-t border-border/60 pt-3 text-sm">
                  <DishImage imagePath={dish.imagePath} imageUrl={dish.imageUrl} t={t} />
                  <p className="text-muted-foreground">{dish.description}</p>
                  <p className="flex items-start gap-2"><UtensilsCrossed size={14} className="mt-0.5 text-muted-foreground" />{t("approval.detail.plating", "Plating")}: {dish.platingNotes}</p>
                  {dish.beverageSuggestion ? (
                    <p className="flex items-center gap-2 text-muted-foreground"><Wine size={14} />{dish.beverageSuggestion}</p>
                  ) : null}
                  {process.env.NODE_ENV === "development" ? <p className="text-xs italic text-muted-foreground">{t("generate.option.imagePrompt", "Image prompt")}: {dish.imagePrompt}</p> : null}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <Sparkles size={14} />
            {t("generate.option.regenerate", "Regenerate")}
          </Button>
          <Button variant={isSelected ? "default" : "outline"} size="sm" onClick={onSelect} disabled={!onSelect || selecting || isSelected}>
            <CheckCircle2 size={14} />
            {selecting ? t("generate.option.selecting", "Selecting...") : isSelected ? t("generate.option.selected", "Selected") : t("generate.option.select", "Select")}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

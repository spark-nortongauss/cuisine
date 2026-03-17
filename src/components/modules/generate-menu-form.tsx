"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CalendarClock, Check, ChefHat, Sparkles, UserRound, Users } from "lucide-react";
import { z } from "zod";
import { generateMenuSchema } from "@/lib/schemas/menu";
import { MenuOption } from "@/types/domain";
import { useI18n } from "@/components/i18n/i18n-provider";
import { MenuOptionCard } from "@/components/modules/menu-option-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { locales } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/messages";
import { formatRestrictionLabel, restrictionOptions } from "@/lib/menu-restrictions";
import { cn } from "@/lib/utils";

const mealTypes: FormValues["mealType"][] = ["breakfast", "brunch", "lunch", "mid-afternoon", "dinner"];
const courseCounts: FormValues["courseCount"][] = [1, 3, 4, 5, 6];

type FormValues = z.input<typeof generateMenuSchema>;
type InviteePreferenceInput = NonNullable<FormValues["inviteePreferences"]>[number];

type GenerateMenuApiResponse = {
  success?: boolean;
  menuId?: string;
  options?: MenuOption[];
  error?: string | { fieldErrors?: Record<string, string[]> };
  code?: string;
};

type GenerateMenuImagesApiResponse = {
  success?: boolean;
  options?: MenuOption[];
};

type Translator = (key: string, fallback?: string) => string;

function nowForDateTimeLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function resolveGenerateErrorMessage(payload: GenerateMenuApiResponse, status: number) {
  const code = payload.code;
  if (payload.error && typeof payload.error === "string") {
    const suffix = process.env.NODE_ENV === "development" && code ? ` (${code})` : "";
    return `Unable to generate menu. ${payload.error}${suffix}`;
  }

  const serveAtError = typeof payload.error === "object" ? payload.error?.fieldErrors?.serveAt?.[0] : undefined;
  if (serveAtError) return serveAtError;

  if (status === 400) return "Unable to generate menu. Please check your menu inputs and try again.";
  return "Unable to generate menu. Please try again.";
}

function hasPendingImages(options: MenuOption[]) {
  return options.some(
    (option) =>
      !option.heroImagePath ||
      (option.heroImagePath && !option.heroImageUrl) ||
      option.dishes.some((dish) => !dish.imagePath || (dish.imagePath && !dish.imageUrl)),
  );
}

async function refreshMenuImagesUntilSettled(menuId: string, locale: string, currentOptions: MenuOption[], prioritizedOptionId?: string) {
  let latest = currentOptions;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (!hasPendingImages(latest)) break;
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const refreshed = await requestMenuImages(menuId, locale, prioritizedOptionId);
    if (!refreshed?.length) continue;
    latest = refreshed;
  }

  return latest;
}

function defaultInviteeLabel(index: number, t: Translator) {
  return `${t("generate.form.individual", "Individual")} ${index + 1}`;
}

function isAutoInviteeLabel(label: string | undefined, index: number) {
  const value = label?.trim();
  if (!value) return true;

  return locales.some((locale) => value === `${translate(locale, "generate.form.individual", "Individual")} ${index + 1}`);
}

function normalizeInviteePreference(invitee: InviteePreferenceInput | undefined, index: number, t: Translator): InviteePreferenceInput {
  return {
    label: invitee?.label?.trim() || defaultInviteeLabel(index, t),
    name: invitee?.name ?? "",
    restrictions: Array.isArray(invitee?.restrictions) ? invitee.restrictions : [],
  };
}

async function requestMenuImages(menuId: string, locale: string, prioritizedOptionId?: string) {
  const res = await fetch("/api/generate-menu-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menuId, prioritizedOptionId, locale }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as GenerateMenuImagesApiResponse;
  if (!data.success || !data.options) return null;
  return data.options;
}

async function requestLocalizedMenuOptions(menuId: string, locale: string) {
  const res = await fetch(`/api/menus/${menuId}/localized-options?locale=${encodeURIComponent(locale)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as GenerateMenuImagesApiResponse;
  if (!data.success || !data.options) return null;
  return data.options;
}

function courseLabel(count: number, t: (key: string, fallback?: string) => string) {
  return `${count} ${count === 1 ? t("generate.form.courseSingle", "course") : t("generate.form.courses", "courses")}`;
}

function mealTypeLabel(value: FormValues["mealType"], t: (key: string, fallback?: string) => string) {
  switch (value) {
    case "breakfast":
      return t("generate.mealTypes.breakfast", "Breakfast");
    case "brunch":
      return t("generate.mealTypes.brunch", "Brunch");
    case "lunch":
      return t("generate.mealTypes.lunch", "Lunch");
    case "mid-afternoon":
      return t("generate.mealTypes.midAfternoon", "Mid-afternoon");
    case "dinner":
      return t("generate.mealTypes.dinner", "Dinner");
    default:
      return value;
  }
}

export function GenerateMenuForm() {
  const { locale, t } = useI18n();
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(generateMenuSchema),
    defaultValues: {
      courseCount: 4,
      mealType: "dinner",
      restrictions: [],
      serveAt: nowForDateTimeLocal(),
      inviteeCount: 6,
      inviteePreferences: Array.from({ length: 6 }, (_, index) => normalizeInviteePreference(undefined, index, t)),
    },
  });

  const inviteeCount = form.watch("inviteeCount") ?? 1;
  const inviteePreferences = form.watch("inviteePreferences") ?? [];
  const restrictions = form.watch("restrictions") ?? [];
  const selectedMealType = form.watch("mealType");
  const selectedCourseCount = form.watch("courseCount");
  const selectedServiceTime = form.watch("serveAt");

  useEffect(() => {
    const currentPreferences = form.getValues("inviteePreferences") ?? [];
    const safeCount = Math.min(60, Math.max(1, inviteeCount || 1));
    const nextPreferences = Array.from({ length: safeCount }, (_, index) => normalizeInviteePreference(currentPreferences[index], index, t));
    const currentRestrictions = form.getValues("restrictions") ?? [];

    const aggregate = Array.from(new Set(nextPreferences.flatMap((invitee) => invitee.restrictions ?? [])));
    if (JSON.stringify(currentPreferences) !== JSON.stringify(nextPreferences)) {
      form.setValue("inviteePreferences", nextPreferences, { shouldDirty: true });
    }
    if (JSON.stringify(currentRestrictions) !== JSON.stringify(aggregate)) {
      form.setValue("restrictions", aggregate, { shouldDirty: true });
    }
  }, [form, inviteeCount, t]);

  useEffect(() => {
    const currentPreferences = form.getValues("inviteePreferences") ?? [];
    const nextPreferences = currentPreferences.map((invitee, index) =>
      isAutoInviteeLabel(invitee?.label, index)
        ? {
            ...invitee,
            label: defaultInviteeLabel(index, t),
          }
        : invitee,
    );

    if (JSON.stringify(currentPreferences) !== JSON.stringify(nextPreferences)) {
      form.setValue("inviteePreferences", nextPreferences, { shouldDirty: true });
    }
  }, [form, locale, t]);

  useEffect(() => {
    if (!menuId) return;
    let cancelled = false;

    void requestLocalizedMenuOptions(menuId, locale).then((nextOptions) => {
      if (!nextOptions?.length || cancelled) return;
      setMenus(nextOptions);
    });

    return () => {
      cancelled = true;
    };
  }, [locale, menuId]);

  const servicePreview = useMemo(() => {
    if (!selectedServiceTime) return "";
    const parsed = new Date(selectedServiceTime);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
  }, [locale, selectedServiceTime]);

  const visibleInvitees = inviteePreferences.slice(0, Math.max(1, inviteeCount));

  const onSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true);
    form.clearErrors("serveAt");

    try {
      const sanitizedPreferences = (values.inviteePreferences ?? [])
        .slice(0, values.inviteeCount)
        .map((invitee, index) => {
          const normalized = normalizeInviteePreference(invitee, index, t);
          return {
            ...normalized,
            name: normalized.name?.trim() || null,
          };
        });
      const aggregate = Array.from(new Set(sanitizedPreferences.flatMap((invitee) => invitee.restrictions ?? [])));

      const res = await fetch("/api/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, inviteePreferences: sanitizedPreferences, restrictions: aggregate, locale }),
      });

      const data = (await res.json()) as GenerateMenuApiResponse;

      if (!res.ok || !data.success) {
        form.setError("serveAt", { message: resolveGenerateErrorMessage(data, res.status) });
        return;
      }

      const createdMenuId = data.menuId ?? null;
      setMenuId(createdMenuId);
      setMenus(data.options ?? []);
      setSelectedOptionId(null);

      if (createdMenuId) {
        void requestMenuImages(createdMenuId, locale).then((nextOptions) => {
          if (!nextOptions?.length) return;

          setMenus(nextOptions);
          void refreshMenuImagesUntilSettled(createdMenuId, locale, nextOptions).then((settledOptions) => {
            if (settledOptions?.length) {
              setMenus(settledOptions);
            }
          });
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected network error";
      const suffix = process.env.NODE_ENV === "development" ? ` (${message})` : "";
      form.setError("serveAt", { message: `Unable to generate menu. Please retry.${suffix}` });
    } finally {
      setIsLoading(false);
    }
  });

  const selectOption = async (optionId: string) => {
    if (!menuId || isSelecting) return;
    setIsSelecting(optionId);

    try {
      const res = await fetch("/api/select-menu-option", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuId, optionId }),
      });
      if (res.ok) {
        setSelectedOptionId(optionId);
        void requestMenuImages(menuId, locale, optionId).then((nextOptions) => {
          if (!nextOptions?.length) return;

          setMenus(nextOptions);
          void refreshMenuImagesUntilSettled(menuId, locale, nextOptions, optionId).then((settledOptions) => {
            if (settledOptions?.length) {
              setMenus(settledOptions);
            }
          });
        });
      }
    } finally {
      setIsSelecting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card variant="glass" className="space-y-6">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-3">
              <Badge variant="accent" className="w-fit">
                {t("generate.form.badge", "Service blueprint")}
              </Badge>
              <div className="space-y-2">
                <h2 className="font-serif text-4xl leading-tight">{t("generate.form.title", "Compose a signature service")}</h2>
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {t("generate.form.description", "Design a cinematic dining journey with structured constraints, guest context, and a luxurious final reveal.")}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="section-label">{t("generate.form.mealType", "Meal Type")}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("generate.form.mealTypeHelper", "Select the service moment so the tone, pacing, and richness of each option feel intentional.")}
                </p>
              </div>
              <SegmentedControl
                options={mealTypes.map((item) => ({
                  value: item,
                  label: mealTypeLabel(item, t),
                  description: t(`generate.form.mealTypeDescription.${item}`, "Tailored pacing and structure"),
                }))}
                value={selectedMealType}
                onChange={(value) => form.setValue("mealType", value, { shouldDirty: true })}
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="section-label">{t("generate.form.courseCount", "Course Count")}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("generate.form.courseCountHelper", "Choose the size of the experience, from a single signature plate to a full tasting progression.")}
                </p>
              </div>
              <SegmentedControl
                compact
                options={courseCounts.map((count) => ({
                  value: count,
                  label: courseLabel(count, t),
                }))}
                value={selectedCourseCount}
                onChange={(value) => form.setValue("courseCount", value, { shouldDirty: true })}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <Users size={14} className="text-primary" />
                  {t("approval.invitees", "Invitees")}
                </span>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  {...form.register("inviteeCount", { valueAsNumber: true })}
                  placeholder={t("generate.form.guestCount", "Guest count")}
                />
              </label>

              <label className="space-y-2">
                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <CalendarClock size={14} className="text-primary" />
                  {t("generate.form.serviceTime", "Service Time")}
                </span>
                <Input type="datetime-local" {...form.register("serveAt")} />
                {servicePreview ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("generate.form.scheduledFor", "Scheduled for")} {servicePreview}
                  </p>
                ) : null}
                {form.formState.errors.serveAt ? <p className="text-xs text-destructive">{form.formState.errors.serveAt.message}</p> : null}
              </label>
            </div>

            <label className="space-y-2">
              <span className="section-label">{t("generate.form.chefNotes", "Chef Notes")}</span>
              <Textarea
                {...form.register("notes")}
                placeholder={t("generate.form.chefNotesPlaceholder", "Desired produce, preferred regions, plating cues, or thematic inspiration.")}
              />
            </label>

            <div className="space-y-4 rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="section-label">{t("generate.form.restrictionsPerIndividual", "Restrictions per individual")}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("generate.form.restrictionsHelper", "Track personal constraints cleanly so the generator can respect both the whole table and each guest.")}
                  </p>
                </div>
                <Badge variant="accent">
                  {restrictions.length} {t("generate.form.uniqueRestrictions", "unique restrictions")}
                </Badge>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {visibleInvitees.map((invitee, inviteeIndex) => (
                  <Card key={`invitee-${inviteeIndex}`} variant="muted" className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="section-label">{t("generate.form.guestProfile", "Guest profile")}</p>
                        <p className="mt-1 font-serif text-2xl">{invitee.label || defaultInviteeLabel(inviteeIndex, t)}</p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-primary">
                        <UserRound size={16} />
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("generate.form.label", "Label")}</span>
                        <Input
                          value={invitee.label}
                          onChange={(event) => {
                            form.setValue(`inviteePreferences.${inviteeIndex}.label`, event.target.value, { shouldDirty: true });
                          }}
                        />
                      </label>
                      <label className="space-y-1.5">
                        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {t("generate.form.firstNameOptional", "First name (optional)")}
                        </span>
                        <Input
                          value={invitee.name ?? ""}
                          onChange={(event) => form.setValue(`inviteePreferences.${inviteeIndex}.name`, event.target.value, { shouldDirty: true })}
                          placeholder={t("generate.form.firstNameExample", "e.g. Ana")}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {restrictionOptions.map((item) => {
                        const selected = (invitee.restrictions ?? []).includes(item);
                        return (
                          <button
                            type="button"
                            key={`${inviteeIndex}-${item}`}
                            onClick={() => {
                              const current = form.getValues(`inviteePreferences.${inviteeIndex}.restrictions`) ?? [];
                              const next = current.includes(item) ? current.filter((value) => value !== item) : [...current, item];
                              form.setValue(`inviteePreferences.${inviteeIndex}.restrictions`, next, { shouldDirty: true });
                              const aggregate = Array.from(
                                new Set((form.getValues("inviteePreferences") ?? []).flatMap((person) => person?.restrictions ?? [])),
                              );
                              form.setValue("restrictions", aggregate, { shouldDirty: true });
                            }}
                            aria-pressed={selected}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                              selected
                                ? "border-primary/30 bg-primary/15 text-primary"
                                : "border-white/10 bg-white/[0.04] text-muted-foreground hover:border-white/20 hover:text-card-foreground",
                            )}
                          >
                            {selected ? <Check size={12} /> : null}
                            {formatRestrictionLabel(t, item)}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.7rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="space-y-1">
                <p className="section-label">{t("generate.form.submitLabel", "Generate options")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("generate.form.submitHelper", "The system will produce three premium options while preserving your guest constraints and timing.")}
                </p>
              </div>
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                <Sparkles size={16} />
                {isLoading ? t("generate.form.generating", "Generating luxurious options...") : t("generate.form.generateOptions", "Generate 3 curated options")}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">{t("generate.summary.eyebrow", "Service snapshot")}</p>
                <h3 className="mt-2 font-serif text-3xl">{t("generate.summary.title", "Your current brief")}</h3>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary">
                <ChefHat size={18} />
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("generate.summary.meal", "Meal type")}</p>
                <p className="mt-2 text-lg font-semibold text-card-foreground">{mealTypeLabel(selectedMealType, t)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("generate.summary.courses", "Course count")}</p>
                <p className="mt-2 text-lg font-semibold text-card-foreground">{courseLabel(selectedCourseCount, t)}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("approval.invitees", "Invitees")}</p>
                <p className="mt-2 text-lg font-semibold text-card-foreground">{inviteeCount}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                <p className="section-label">{t("generate.summary.schedule", "Service timing")}</p>
                <p className="mt-2 text-sm leading-relaxed text-card-foreground">{servicePreview || t("common.noDate", "No date")}</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="section-label">{t("generate.summary.restrictions", "Restriction map")}</p>
                <Badge variant="accent">{restrictions.length}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {restrictions.length ? (
                  restrictions.map((restriction) => (
                    <Badge key={restriction} variant="default" className="tracking-[0.08em] normal-case">
                      {formatRestrictionLabel(t, restriction)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">{t("generate.summary.restrictionsEmpty", "No restrictions selected yet.")}</p>
                )}
              </div>
            </div>
          </Card>

          {isLoading ? (
            <Card className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </Card>
          ) : null}
        </div>
      </div>

      <motion.div layout className="space-y-4">
        {menus.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-label">{t("generate.results.eyebrow", "Generated options")}</p>
              <h3 className="mt-2 font-serif text-3xl">{t("generate.results.title", "Compare the strongest directions")}</h3>
            </div>
            <Badge variant="success">
              {menus.length} {t("generate.form.optionsGenerated", "options generated")}
            </Badge>
          </div>
        ) : null}

        {menus.map((menu) => (
          <MenuOptionCard
            key={menu.id}
            option={menu}
            onSelect={() => selectOption(menu.id)}
            isSelected={selectedOptionId === menu.id}
            selecting={isSelecting === menu.id}
          />
        ))}
      </motion.div>
    </div>
  );
}

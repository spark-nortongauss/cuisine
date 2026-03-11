"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CalendarClock, Check, Sparkles, UserRound, Users } from "lucide-react";
import { generateMenuSchema } from "@/lib/schemas/menu";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MenuOptionCard } from "@/components/modules/menu-option-card";
import { MenuOption } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/i18n-provider";

const restrictionOptions = ["seafood", "shellfish", "gluten", "lactose", "peanuts", "tree nuts", "eggs", "soy", "sesame", "vegetarian", "vegan", "pork-free", "diabetes type 1", "diabetes type 2"];
const mealTypes: FormValues["mealType"][] = ["breakfast", "brunch", "lunch", "mid-afternoon", "dinner"];
const courseCounts: FormValues["courseCount"][] = [3, 4, 5, 6];

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

async function refreshMenuImagesUntilSettled(menuId: string, currentOptions: MenuOption[], prioritizedOptionId?: string) {
  let latest = currentOptions;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (!hasPendingImages(latest)) break;
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const refreshed = await requestMenuImages(menuId, prioritizedOptionId);
    if (!refreshed?.length) continue;
    latest = refreshed;
  }

  return latest;
}

function normalizeInviteePreference(invitee: InviteePreferenceInput | undefined, index: number): InviteePreferenceInput {
  return {
    label: invitee?.label?.trim() || `Individual ${index + 1}`,
    name: invitee?.name ?? "",
    restrictions: Array.isArray(invitee?.restrictions) ? invitee.restrictions : [],
  };
}

async function requestMenuImages(menuId: string, prioritizedOptionId?: string) {
  const res = await fetch("/api/generate-menu-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ menuId, prioritizedOptionId }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as GenerateMenuImagesApiResponse;
  if (!data.success || !data.options) return null;
  return data.options;
}

export function GenerateMenuForm() {
  const { t } = useI18n();
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
      inviteePreferences: Array.from({ length: 6 }, (_, index) => normalizeInviteePreference(undefined, index)),
    },
  });

  const inviteeCount = form.watch("inviteeCount") ?? 1;
  const inviteePreferences = form.watch("inviteePreferences") ?? [];

  useEffect(() => {
    const safeCount = Math.min(60, Math.max(1, inviteeCount || 1));
    const nextPreferences = Array.from({ length: safeCount }, (_, index) => normalizeInviteePreference(inviteePreferences[index], index));

    form.setValue("inviteePreferences", nextPreferences, { shouldDirty: true });

    const aggregate = Array.from(new Set(nextPreferences.flatMap((invitee) => invitee.restrictions ?? [])));
    form.setValue("restrictions", aggregate, { shouldDirty: true });
  }, [inviteeCount]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true);
    form.clearErrors("serveAt");

    try {
      const sanitizedPreferences = (values.inviteePreferences ?? [])
        .slice(0, values.inviteeCount)
        .map((invitee, index) => {
          const normalized = normalizeInviteePreference(invitee, index);
          return {
            ...normalized,
            name: normalized.name?.trim() || null,
          };
        });
      const aggregate = Array.from(new Set(sanitizedPreferences.flatMap((invitee) => invitee.restrictions ?? [])));

      const res = await fetch("/api/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, inviteePreferences: sanitizedPreferences, restrictions: aggregate }),
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
        void requestMenuImages(createdMenuId).then((nextOptions) => {
          if (!nextOptions?.length) return;

          setMenus(nextOptions);
          void refreshMenuImagesUntilSettled(createdMenuId, nextOptions).then((settledOptions) => {
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

  const selectedMealType = form.watch("mealType");
  const selectedCourseCount = form.watch("courseCount");
  const selectedServiceTime = form.watch("serveAt");
  const servicePreview = useMemo(() => {
    if (!selectedServiceTime) return "";
    const parsed = new Date(selectedServiceTime);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
  }, [selectedServiceTime]);

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
        void requestMenuImages(menuId, optionId).then((nextOptions) => {
          if (!nextOptions?.length) return;

          setMenus(nextOptions);
          void refreshMenuImagesUntilSettled(menuId, nextOptions, optionId).then((settledOptions) => {
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
    <div className="space-y-5">
      <Card variant="glass">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <h2 className="font-serif text-3xl">{t("generate.form.title", "Compose a signature service")}</h2>
            <p className="text-sm text-muted-foreground">{t("generate.form.description", "Design a cinematic dining journey with structured constraints, guest context, and a luxurious final reveal.")}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("generate.form.mealType", "Meal Type")}</p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {mealTypes.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => form.setValue("mealType", item)}
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm capitalize transition",
                    selectedMealType === item ? "border-primary/40 bg-primary/10 text-primary" : "border-border/70 bg-card/70 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("generate.form.courseCount", "Course Count")}</p>
            <div className="flex flex-wrap gap-2">
              {courseCounts.map((count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => form.setValue("courseCount", count)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition",
                    selectedCourseCount === count ? "border-primary/40 bg-primary/10 text-primary" : "border-border/70 bg-card/70 text-muted-foreground",
                  )}
                >
                  {count} {t("generate.form.courses", "courses")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Users size={14} />{t("approval.invitees", "Invitees")}</span>
              <Input type="number" min={1} max={60} {...form.register("inviteeCount", { valueAsNumber: true })} placeholder={t("generate.form.guestCount", "Guest count")} />
            </label>
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><CalendarClock size={14} />{t("generate.form.serviceTime", "Service Time")}</span>
              <Input type="datetime-local" {...form.register("serveAt")} />
              {servicePreview ? <p className="text-xs text-muted-foreground">{t("generate.form.scheduledFor", "Scheduled for")} {servicePreview}</p> : null}
              {form.formState.errors.serveAt ? <p className="text-xs text-destructive">{form.formState.errors.serveAt.message}</p> : null}
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("generate.form.chefNotes", "Chef Notes")}</span>
            <Textarea {...form.register("notes")} placeholder={t("generate.form.chefNotesPlaceholder", "Desired produce, preferred regions, plating cues, or thematic inspiration.")} />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("generate.form.restrictionsPerIndividual", "Restrictions per individual")}</p>
              <Badge variant="accent">{(form.watch("restrictions") ?? []).length} {t("generate.form.uniqueRestrictions", "unique restrictions")}</Badge>
            </div>
            <div className="space-y-3">
              {(form.watch("inviteePreferences") ?? []).slice(0, Math.max(1, inviteeCount)).map((invitee, inviteeIndex) => (
                <Card key={`invitee-${inviteeIndex}`} variant="muted" className="space-y-3 p-4">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground"><UserRound size={13} />{t("generate.form.label", "Label")}</span>
                      <Input
                        value={invitee.label}
                        onChange={(event) => {
                          form.setValue(`inviteePreferences.${inviteeIndex}.label`, event.target.value);
                        }}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("generate.form.firstNameOptional", "First name (optional)")}</span>
                      <Input
                        value={invitee.name ?? ""}
                        onChange={(event) => form.setValue(`inviteePreferences.${inviteeIndex}.name`, event.target.value)}
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
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition",
                            selected ? "border-primary/45 bg-primary/10 text-primary" : "border-border/70 bg-card/70 text-muted-foreground",
                          )}
                        >
                          {selected ? <Check size={12} /> : null}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
            <Sparkles size={16} />
            {isLoading ? t("generate.form.generating", "Generating luxurious options...") : t("generate.form.generateOptions", "Generate 3 curated options")}
          </Button>
        </form>
      </Card>

      {isLoading ? (
        <Card className="space-y-3">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </Card>
      ) : null}

      <motion.div layout className="space-y-4">
        {menus.length > 0 ? <Badge variant="success">{menus.length} {t("generate.form.optionsGenerated", "options generated")}</Badge> : null}
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

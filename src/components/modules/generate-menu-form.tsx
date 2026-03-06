"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CalendarClock, Check, Sparkles, Users } from "lucide-react";
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

const restrictions = ["seafood", "shellfish", "gluten", "lactose", "peanuts", "tree nuts", "eggs", "soy", "sesame", "vegetarian", "vegan", "pork-free", "diabetes type 1", "diabetes type 2"];
const mealTypes: FormValues["mealType"][] = ["breakfast", "brunch", "lunch", "mid-afternoon", "dinner"];
const courseCounts: FormValues["courseCount"][] = [3, 4, 5, 6];

type FormValues = z.input<typeof generateMenuSchema>;

function nowForDateTimeLocal() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function GenerateMenuForm() {
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(generateMenuSchema),
    defaultValues: {
      courseCount: 4,
      mealType: "dinner",
      restrictions: [],
      serveAt: nowForDateTimeLocal(),
      inviteeCount: 6,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true);
    const res = await fetch("/api/generate-menu", { method: "POST", body: JSON.stringify(values) });
    const data = await res.json();
    if (!res.ok) {
      form.setError("serveAt", { message: data?.error?.fieldErrors?.serveAt?.[0] ?? "Unable to generate menu" });
      setIsLoading(false);
      return;
    }
    setMenus(data.options ?? []);
    setIsLoading(false);
  });

  const selectedMealType = form.watch("mealType");
  const selectedCourseCount = form.watch("courseCount");
  const selectedRestrictions = form.watch("restrictions") ?? [];
  const selectedServiceTime = form.watch("serveAt");
  const servicePreview = useMemo(() => {
    if (!selectedServiceTime) return "";
    const parsed = new Date(selectedServiceTime);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(parsed);
  }, [selectedServiceTime]);

  return (
    <div className="space-y-5">
      <Card variant="glass">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <h2 className="font-serif text-3xl">Compose a signature service</h2>
            <p className="text-sm text-muted-foreground">Design a cinematic dining journey with structured constraints, guest context, and a luxurious final reveal.</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Meal Type</p>
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
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Course Count</p>
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
                  {count} courses
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><Users size={14} />Invitees</span>
              <Input type="number" min={1} max={60} {...form.register("inviteeCount", { valueAsNumber: true })} placeholder="Guest count" />
            </label>
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"><CalendarClock size={14} />Service Time</span>
              <Input type="datetime-local" {...form.register("serveAt")} />
              {servicePreview ? <p className="text-xs text-muted-foreground">Scheduled for {servicePreview}</p> : null}
              {form.formState.errors.serveAt ? <p className="text-xs text-destructive">{form.formState.errors.serveAt.message}</p> : null}
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Chef Notes</span>
            <Textarea {...form.register("notes")} placeholder="Desired produce, preferred regions, plating cues, or thematic inspiration." />
          </label>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Restrictions</p>
            <div className="flex flex-wrap gap-2">
              {restrictions.map((item) => {
                const active = selectedRestrictions.includes(item);
                return (
                  <label
                    key={item}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
                      active ? "border-primary/40 bg-primary/10 text-primary" : "border-border/70 bg-card/70 text-muted-foreground",
                    )}
                  >
                    <input type="checkbox" value={item} {...form.register("restrictions")} className="sr-only" />
                    {active ? <Check size={12} /> : null}
                    {item}
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
            <Sparkles size={16} />
            {isLoading ? "Generating luxurious options..." : "Generate 3 curated options"}
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
        {menus.length > 0 ? <Badge variant="success">{menus.length} options generated</Badge> : null}
        {menus.map((menu) => (
          <MenuOptionCard key={menu.id} option={menu} />
        ))}
      </motion.div>
    </div>
  );
}

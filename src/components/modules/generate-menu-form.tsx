"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { generateMenuSchema } from "@/lib/schemas/menu";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MenuOptionCard } from "@/components/modules/menu-option-card";
import { MenuOption } from "@/types/domain";

const restrictions = ["seafood", "shellfish", "gluten", "lactose", "peanuts", "tree nuts", "eggs", "soy", "sesame", "vegetarian", "vegan", "pork-free", "diabetes type 1", "diabetes type 2"];

type FormValues = z.infer<typeof generateMenuSchema>;

export function GenerateMenuForm() {
  const [menus, setMenus] = useState<MenuOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(generateMenuSchema),
    defaultValues: {
      courseCount: 4,
      mealType: "dinner",
      restrictions: [],
      serveAt: new Date().toISOString(),
      inviteeCount: 6,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true);
    const res = await fetch("/api/generate-menu", { method: "POST", body: JSON.stringify(values) });
    const data = await res.json();
    setMenus(data.options ?? []);
    setIsLoading(false);
  });

  return (
    <div className="space-y-4">
      <Card>
        <form className="space-y-3" onSubmit={onSubmit}>
          <h2 className="font-serif text-2xl">Generate Michelin-like menus</h2>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" min={3} max={6} {...form.register("courseCount", { valueAsNumber: true })} placeholder="Courses" />
            <Input type="number" min={1} max={60} {...form.register("inviteeCount", { valueAsNumber: true })} placeholder="Invitees" />
          </div>
          <Input {...form.register("mealType")} placeholder="Meal type" />
          <Input type="datetime-local" {...form.register("serveAt")} />
          <Textarea {...form.register("notes")} placeholder="Chef notes" />
          <div className="flex flex-wrap gap-2">
            {restrictions.map((item) => (
              <label key={item} className="rounded-full border border-border px-3 py-1 text-xs">
                <input type="checkbox" value={item} {...form.register("restrictions")} className="mr-1" />
                {item}
              </label>
            ))}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate 3 options"}
          </Button>
        </form>
      </Card>
      <motion.div layout className="space-y-4">
        {menus.map((menu) => (
          <MenuOptionCard key={menu.id} option={menu} />
        ))}
      </motion.div>
    </div>
  );
}

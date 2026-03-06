"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { motion } from "framer-motion";
import { ChevronDown, Sparkles, UtensilsCrossed, Wine } from "lucide-react";
import { MenuOption } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MenuOptionCard({ option }: { option: MenuOption }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card variant="feature" className="space-y-5 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Curated option</p>
            <h3 className="font-serif text-3xl md:text-4xl">{option.title}</h3>
          </div>
          <Badge variant="accent">Michelin-inspired</Badge>
        </div>

        <p className="text-sm text-muted-foreground md:text-base">{option.concept}</p>

        <Accordion.Root type="single" collapsible defaultValue="course-0" className="space-y-3">
          {option.dishes.map((dish, index) => (
            <Accordion.Item key={`${dish.course}-${dish.name}`} value={`course-${index}`} className="overflow-hidden rounded-2xl border border-border/70 bg-card/75">
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
                <div className="space-y-2 border-t border-border/60 pt-3 text-sm">
                  <p className="text-muted-foreground">{dish.description}</p>
                  <p className="flex items-start gap-2"><UtensilsCrossed size={14} className="mt-0.5 text-muted-foreground" />Plating: {dish.platingNotes}</p>
                  {dish.beverageSuggestion ? (
                    <p className="flex items-center gap-2 text-muted-foreground"><Wine size={14} />{dish.beverageSuggestion}</p>
                  ) : null}
                  <p className="text-xs italic text-muted-foreground">Image prompt: {dish.imagePrompt}</p>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>

        <div className="flex flex-wrap gap-2">
          <Button size="sm">
            <Sparkles size={14} />
            Regenerate
          </Button>
          <Button variant="outline" size="sm">
            Share
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

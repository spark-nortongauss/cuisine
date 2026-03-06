"use client";

import { motion } from "framer-motion";
import { Sparkles, Wine } from "lucide-react";
import { MenuOption } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function MenuOptionCard({ option }: { option: MenuOption }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Menu option</p>
            <h3 className="font-serif text-2xl">{option.title}</h3>
          </div>
          <Badge className="bg-accent text-foreground">Michelin-inspired</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{option.concept}</p>
        <div className="space-y-3">
          {option.dishes.map((dish) => (
            <div key={`${dish.course}-${dish.name}`} className="rounded-xl border border-border p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dish.course}</p>
              <p className="font-medium">{dish.name}</p>
              <p className="text-sm text-muted-foreground">{dish.description}</p>
              <p className="mt-1 text-xs">Plating: {dish.platingNotes}</p>
              {dish.beverageSuggestion && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Wine size={12} /> {dish.beverageSuggestion}
                </p>
              )}
              <p className="mt-1 text-xs italic text-muted-foreground">Image prompt: {dish.imagePrompt}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm"><Sparkles size={14} />Regenerate</Button>
          <Button variant="outline" size="sm">Share</Button>
        </div>
      </Card>
    </motion.div>
  );
}

"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function CollapsibleSections({
  sections,
  defaultOpen = [],
}: {
  sections: { id: string; title: string; content: React.ReactNode }[];
  defaultOpen?: string[];
}) {
  return (
    <Accordion.Root type="multiple" defaultValue={defaultOpen} className="space-y-3">
      {sections.map((section, index) => (
        <motion.div key={section.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}>
          <Accordion.Item value={section.id} className="overflow-hidden rounded-3xl border border-white/10 bg-premium-panel shadow-soft">
            <Accordion.Header>
              <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-serif text-xl tracking-[0.01em] text-card-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                <span>{section.title}</span>
                <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180")} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="border-t border-white/8 px-4 py-4">{section.content}</div>
            </Accordion.Content>
          </Accordion.Item>
        </motion.div>
      ))}
    </Accordion.Root>
  );
}

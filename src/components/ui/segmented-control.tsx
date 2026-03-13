"use client";

import { useId, type ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type SegmentedOption<TValue extends string | number> = {
  value: TValue;
  label: string;
  description?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
};

type SegmentedControlProps<TValue extends string | number> = {
  options: SegmentedOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  className?: string;
  compact?: boolean;
};

export function SegmentedControl<TValue extends string | number>({
  options,
  value,
  onChange,
  className,
  compact = false,
}: SegmentedControlProps<TValue>) {
  const reducedMotion = useReducedMotion();
  const layoutId = useId();

  return (
    <div className={cn("grid gap-2 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-1.5 shadow-soft backdrop-blur-xl", compact ? "grid-cols-2 sm:grid-cols-none sm:auto-cols-fr sm:grid-flow-col" : "grid-cols-1 sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col", className)}>
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex min-h-14 items-center gap-3 rounded-[1.2rem] px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55",
              compact ? "justify-center px-3 py-2 text-center" : "",
              active ? "text-card-foreground" : "text-muted-foreground hover:text-card-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={layoutId}
                transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 34 }}
                className="absolute inset-0 rounded-[1.2rem] border border-primary/20 bg-white/[0.08] shadow-soft"
              />
            ) : null}
            <span className="relative z-10 flex items-center gap-3">
              {Icon ? (
                <span className={cn("flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]", active ? "text-primary" : "text-muted-foreground")}>
                  <Icon size={16} />
                </span>
              ) : null}
              <span className={cn("relative z-10", compact ? "flex flex-col items-center text-center" : "space-y-0.5")}>
                <span className={cn("block text-sm font-semibold", compact ? "" : "leading-none")}>{option.label}</span>
                {option.description && !compact ? <span className="block text-xs leading-relaxed text-muted-foreground">{option.description}</span> : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      className={cn("space-y-6 md:space-y-8", className)}
      initial={reducedMotion ? undefined : { opacity: 0, y: 16 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.section>
  );
}

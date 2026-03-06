"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      className={cn("space-y-6", className)}
      initial={reducedMotion ? undefined : { opacity: 0, y: 14 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

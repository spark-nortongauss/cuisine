"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function AmbientOrbs() {
  const orbA = useRef<HTMLDivElement | null>(null);
  const orbB = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut", duration: 8 } });
    if (orbA.current && orbB.current) {
      tl.to(orbA.current, { x: 24, y: 16, opacity: 0.42 }, 0).to(orbB.current, { x: -20, y: -14, opacity: 0.36 }, 0);
    }

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <>
      <div ref={orbA} className="pointer-events-none fixed -left-16 top-10 h-72 w-72 rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div ref={orbB} className="pointer-events-none fixed -right-20 top-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl" aria-hidden />
    </>
  );
}

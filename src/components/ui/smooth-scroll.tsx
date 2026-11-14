"use client";

import * as React from "react";
import Lenis from "lenis";

export interface SmoothScrollProps {
  children: React.ReactNode;
}

/**
 * SmoothScroll (Lenis provider)
 * Enabled ONLY for public pages on fine-pointer devices (desktop mouse/trackpad).
 * Disabled on touch screens and when prefers-reduced-motion is active.
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;

    if (prefersReducedMotion || !isFinePointer) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    let animationFrameId: number;

    function raf(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }

    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

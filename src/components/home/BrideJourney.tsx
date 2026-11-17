"use client";

import * as React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import type { JourneyContent } from "@/content/journey";
import { cn } from "@/lib/cn";

export interface BrideJourneyProps {
  content: JourneyContent;
  counts: Record<string, number>;
  weddingDate?: string | null;
}

interface Point {
  x: number;
  y: number;
}

interface Connector {
  x1: number;
  x2: number;
  y: number;
}

// 30 tiny stars positioned deterministically in the upper 55% of the sky layer
const STARS = [
  { top: 7, left: 18 },
  { top: 12, left: 74 },
  { top: 16, left: 35 },
  { top: 22, left: 88 },
  { top: 28, left: 12 },
  { top: 33, left: 58 },
  { top: 38, left: 82 },
  { top: 43, left: 24 },
  { top: 48, left: 66 },
  { top: 52, left: 45 },
  { top: 9, left: 62 },
  { top: 14, left: 41 },
  { top: 19, left: 91 },
  { top: 25, left: 27 },
  { top: 30, left: 78 },
  { top: 35, left: 15 },
  { top: 40, left: 52 },
  { top: 45, left: 85 },
  { top: 50, left: 31 },
  { top: 54, left: 70 },
  { top: 6, left: 84 },
  { top: 11, left: 29 },
  { top: 17, left: 68 },
  { top: 23, left: 48 },
  { top: 29, left: 95 },
  { top: 34, left: 38 },
  { top: 39, left: 19 },
  { top: 44, left: 77 },
  { top: 49, left: 55 },
  { top: 53, left: 10 },
];

export function BrideJourney({ content, counts, weddingDate }: BrideJourneyProps) {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const listRef = React.useRef<HTMLOListElement | null>(null);
  const stopRefs = React.useRef<(HTMLLIElement | null)[]>([]);
  const circleRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const drawnPathRef = React.useRef<SVGPathElement | null>(null);
  const rafIdRef = React.useRef<number | null>(null);

  const [progress, setProgress] = React.useState(0);
  const [tone, setTone] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [points, setPoints] = React.useState<Point[]>([]);
  const [connectors, setConnectors] = React.useState<Connector[]>([]);
  const [pathD, setPathD] = React.useState<string>("");
  const [pathLength, setPathLength] = React.useState<number>(0);
  const [movingPoint, setMovingPoint] = React.useState<Point | null>(null);
  const [orbY, setOrbY] = React.useState<number>(60);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  // Check prefers-reduced-motion
  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Path computation & measurement
  // Node y is the vertical center of the CIRCLE (or pair), measured relative to list
  const rebuildPath = React.useCallback(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const cRect = listEl.getBoundingClientRect();
    if (cRect.width === 0 || cRect.height === 0) return;

    const isMobile = window.innerWidth < 700;
    const computedPoints: Point[] = [];
    const computedConnectors: Connector[] = [];

    for (let i = 0; i < content.stops.length; i++) {
      const circleEl = circleRefs.current[i];
      if (!circleEl) continue;

      const circleRect = circleEl.getBoundingClientRect();
      // Node y is the exact vertical center of the stop's circle
      const nodeY = circleRect.top - cRect.top + circleRect.height / 2;

      let nodeX: number;
      if (isMobile) {
        nodeX = cRect.width - 16;
      } else {
        const isOdd = (i + 1) % 2 === 1;
        nodeX = cRect.width / 2 + (isOdd ? -34 : 34);
      }

      computedPoints.push({ x: nodeX, y: nodeY });

      // Horizontal connector from node to circle edge
      const circleLeft = circleRect.left - cRect.left;
      const circleRight = circleRect.right - cRect.left;
      const circleCenterX = (circleLeft + circleRight) / 2;

      let connX1: number;
      let connX2: number;
      if (circleCenterX < nodeX) {
        connX1 = circleRight;
        connX2 = nodeX;
      } else {
        connX1 = nodeX;
        connX2 = circleLeft;
      }

      computedConnectors.push({ x1: connX1, x2: connX2, y: nodeY });
    }

    if (computedPoints.length === 0) return;

    setPoints(computedPoints);
    setConnectors(computedConnectors);

    // Build cubic Bezier S-curve winding line
    // Starts at (first.x, 0) and ENDS at the last node (does not extend to section bottom)
    const first = computedPoints[0];
    let d = `M ${first.x} 0`;

    // Curve to first node
    const midYFirst = first.y / 2;
    d += ` C ${first.x} ${midYFirst}, ${first.x} ${midYFirst}, ${first.x} ${first.y}`;

    // Between consecutive stops
    for (let i = 1; i < computedPoints.length; i++) {
      const prev = computedPoints[i - 1];
      const curr = computedPoints[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }

    setPathD(d);
  }, [content.stops.length]);

  // Measure path length after pathD updates
  React.useEffect(() => {
    if (drawnPathRef.current && pathD) {
      try {
        const len = drawnPathRef.current.getTotalLength();
        setPathLength(len);
      } catch {
        // Fallback for environments where getTotalLength is not available
      }
    }
  }, [pathD]);

  // Scroll and progress calculation
  const updateScroll = React.useCallback(() => {
    if (prefersReducedMotion) {
      setProgress(1);
      setTone(2);
      setActiveIndex(0);
      return;
    }

    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const sRect = sectionEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const sectionTop = sRect.top;
    const sectionHeight = sRect.height;

    // progress = clamp((viewportHeight * 0.55 - sectionTop) / sectionHeight, 0, 1)
    const rawProgress = (vh * 0.55 - sectionTop) / sectionHeight;
    const clampedProgress = Math.max(0, Math.min(1, rawProgress));

    // tone = min(5, floor(progress * 6))
    const currentTone = Math.min(5, Math.floor(clampedProgress * 6));

    // Sun/moon vertical position: 60px + vh * 0.32 * (1 - sin(PI * min(1, progress * 1.1)))
    const currentOrbY =
      60 + vh * 0.32 * (1 - Math.sin(Math.PI * Math.min(1, clampedProgress * 1.1)));

    // Active stop: the stop whose circle center is closest to viewport focal line (vh * 0.52)
    const focalY = vh * 0.52;
    let closestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < circleRefs.current.length; i++) {
      const el = circleRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const circleCenterY = rect.top + rect.height / 2;
      const dist = Math.abs(circleCenterY - focalY);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = i;
      }
    }

    setProgress(clampedProgress);
    setTone(currentTone);
    setOrbY(currentOrbY);
    setActiveIndex(closestIdx);

    // Update moving dot position along the path
    if (drawnPathRef.current && pathLength > 0) {
      try {
        const pt = drawnPathRef.current.getPointAtLength(pathLength * clampedProgress);
        setMovingPoint({ x: pt.x, y: pt.y });
      } catch {
        // SVG point retrieval failed
      }
    }
  }, [prefersReducedMotion, pathLength]);

  // RequestAnimationFrame throttled scheduler
  const scheduleRebuild = React.useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      rebuildPath();
      updateScroll();
    });
  }, [rebuildPath, updateScroll]);

  // Recompute path whenever layout changes:
  // ResizeObserver on list element, on every stop, on every circle,
  // on every <img> load event, plus document.fonts.ready
  React.useEffect(() => {
    scheduleRebuild();

    const ro = new ResizeObserver(() => {
      scheduleRebuild();
    });

    if (listRef.current) ro.observe(listRef.current);
    stopRefs.current.forEach((el) => el && ro.observe(el));
    circleRefs.current.forEach((el) => el && ro.observe(el));

    // Capture image load events inside list element
    const listEl = listRef.current;
    const onImgLoad = () => scheduleRebuild();
    if (listEl) {
      listEl.addEventListener("load", onImgLoad, true);
    }

    // document.fonts.ready
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(scheduleRebuild).catch(() => {});
    }

    let scrollTicking = false;
    const onScroll = () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          updateScroll();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleRebuild);
    window.addEventListener("load", scheduleRebuild);

    return () => {
      ro.disconnect();
      if (listEl) listEl.removeEventListener("load", onImgLoad, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleRebuild);
      window.removeEventListener("load", scheduleRebuild);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [scheduleRebuild, updateScroll]);

  // Star opacity based on tone: 0 until tone 4, 0.35 at tone 4, 0.9 at tone 5
  let starOpacity = 0;
  if (!prefersReducedMotion) {
    if (tone === 4) starOpacity = 0.35;
    else if (tone === 5) starOpacity = 0.9;
  }

  // Active tone class: journey-tone-0 through journey-tone-5 (tone 2 for reduced motion)
  const activeToneClass = prefersReducedMotion ? "journey-tone-2" : `journey-tone-${tone}`;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="journey-heading"
      className={cn(
        "journey-section relative w-full pt-20 sm:pt-28 lg:pt-36 pb-[12vh]",
        activeToneClass
      )}
    >
      {/* ─── Sticky Sky Layer (Physical Left: Sun/Moon Orb + Stars) ───────── */}
      {/* Section has no overflow-hidden so this sticky container can stick to the viewport */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden pointer-events-none">
          {/* 30 Tiny Stars */}
          {STARS.map((star, idx) => (
            <div
              key={idx}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: "3px",
                height: "3px",
                top: `${star.top}%`,
                left: `${star.left}%`,
                backgroundColor: "var(--journey-text)",
                opacity: starOpacity,
                transition: "opacity 1.6s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
          ))}

          {/* Sun / Moon Orb at physical left */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: "clamp(16px, 3.5vw, 56px)",
              right: "auto",
              transform: prefersReducedMotion
                ? "translateY(60px)"
                : `translateY(${orbY}px)`,
              transition: prefersReducedMotion ? "none" : "transform 0.1s linear",
            }}
          >
            <div
              className="relative rounded-full flex items-center justify-center"
              style={{
                width: "clamp(36px, 5vw, 64px)",
                height: "clamp(36px, 5vw, 64px)",
                backgroundColor: "var(--journey-orb)",
                transition: "background-color 1.4s ease",
              }}
            >
              {/* Soft halo ring at 22% opacity */}
              <div
                className="absolute inset-[-8px] rounded-full pointer-events-none"
                style={{
                  backgroundColor: "var(--journey-orb)",
                  opacity: 0.22,
                  transition: "background-color 1.4s ease",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Section Content ────────────────────────────────────────── */}
      <Container className="relative z-10">
        {/* Section Heading & Copy */}
        <div className="mx-auto max-w-3xl text-center mb-16 sm:mb-24">
          {content.eyebrow && (
            <span
              className="eyebrow block mb-3 font-semibold"
              style={{ color: "var(--journey-line)" }}
            >
              {content.eyebrow}
            </span>
          )}
          <h2
            id="journey-heading"
            className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6"
            style={{ color: "var(--journey-text)" }}
          >
            {content.title}
          </h2>
          <p
            className="text-sm sm:text-base leading-[1.85] max-w-2xl mx-auto"
            style={{ color: "var(--journey-muted)" }}
          >
            {content.paragraph}
          </p>
        </div>

        {/* Stops Ordered List with SVG Path Overlay */}
        <ol
          ref={listRef}
          className="relative mx-auto max-w-5xl list-none p-0 m-0"
        >
          {/* SVG Overlay covering the list */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            {pathD && (
              <>
                {/* Horizontal connectors from node to circle edge */}
                {connectors.map((conn, idx) => (
                  <line
                    key={`conn-${idx}`}
                    x1={conn.x1}
                    y1={conn.y}
                    x2={conn.x2}
                    y2={conn.y}
                    stroke="var(--journey-line)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ))}

                {/* Faint full-length path copy underneath (22% opacity) */}
                <path
                  d={pathD}
                  stroke="var(--journey-line)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.22"
                />

                {/* Drawn copy on top driven by scroll progress */}
                <path
                  ref={drawnPathRef}
                  d={pathD}
                  stroke="var(--journey-line)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={prefersReducedMotion ? undefined : pathLength || 1}
                  strokeDashoffset={
                    prefersReducedMotion ? 0 : (pathLength || 1) * (1 - progress)
                  }
                />

                {/* Node circle at every stop: r=9, filled with background color, 2px stroke */}
                {points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="9"
                    fill="var(--journey-bg)"
                    stroke="var(--journey-line)"
                    strokeWidth="2"
                  />
                ))}

                {/* Moving dot at the point of progress: r=8, filled with line color */}
                {!prefersReducedMotion && movingPoint && (
                  <circle
                    cx={movingPoint.x}
                    cy={movingPoint.y}
                    r="8"
                    fill="var(--journey-line)"
                  />
                )}
              </>
            )}
          </svg>

          {/* Stops List */}
          {content.stops.map((stop, idx) => {
            const isActive = prefersReducedMotion || idx === activeIndex;
            const isEven = (idx + 1) % 2 === 0;

            // Single circle diameter vs dual circles width for title centering
            const circleWidthStyle = stop.dualImages
              ? "calc(2 * clamp(160px, 22vw, 250px) - 34px)"
              : "clamp(200px, 28vw, 340px)";

            return (
              <li
                key={stop.id}
                ref={(el) => {
                  stopRefs.current[idx] = el;
                }}
                className={cn(
                  "relative z-10 mb-[12vh] md:mb-[14vh] last:mb-0 transition-opacity duration-800",
                  isActive ? "opacity-100" : "opacity-30"
                )}
                style={{
                  transition: prefersReducedMotion
                    ? "none"
                    : "opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {/* 
                  Two-column grid hugging center path:
                  Desktop: Row 1 has Picture & Items side-by-side vertically centered directly in front of each other!
                           Row 2 has Stop Title centered directly under the Picture!
                  Mobile: Single column in natural order (Picture -> Title -> Items).
                */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center w-full">
                  {/* ─── 1. PICTURE (CIRCLE) BLOCK ─────────────────────── */}
                  <div
                    className={cn(
                      "order-1 flex flex-col items-center justify-center md:row-start-1",
                      // Alternating sides on desktop:
                      // Odd stops: Picture is in Col 1 (RTL start / right), hugging center line with end padding
                      // Even stops: Picture is in Col 2 (RTL end / left), hugging center line with start padding
                      isEven
                        ? "md:col-start-2 md:items-start ps-0 md:ps-[clamp(56px,6vw,96px)]"
                        : "md:col-start-1 md:items-end pe-0 md:pe-[clamp(56px,6vw,96px)]"
                    )}
                  >
                    <div
                      ref={(el) => {
                        circleRefs.current[idx] = el;
                      }}
                      className="journey-circle-box flex items-center justify-center rounded-full"
                      style={{
                        transform: prefersReducedMotion
                          ? "none"
                          : isActive
                          ? "scale(1)"
                          : "scale(0.94)",
                        boxShadow: prefersReducedMotion
                          ? "none"
                          : isActive
                          ? "0 0 0 10px color-mix(in srgb, var(--journey-line) 14%, transparent)"
                          : "none",
                        transition: prefersReducedMotion
                          ? "none"
                          : "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      {stop.dualImages ? (
                        // Prayer Stop (4): Two overlapping circles side by side
                        <div className="flex items-center justify-center">
                          {/* 4a: Katb el-ketab */}
                          <div
                            className="rounded-full flex items-center justify-center shrink-0 relative z-10"
                            style={{
                              width: "clamp(160px, 22vw, 250px)",
                              height: "clamp(160px, 22vw, 250px)",
                              border: "2px solid var(--journey-line)",
                              padding: "7px",
                              transition: "border-color 1.4s ease",
                            }}
                          >
                            <div className="journey-photo-grade relative w-full h-full rounded-full overflow-hidden">
                              <CloudinaryImage
                                publicId={stop.dualImages[0].cloudinaryPublicId}
                                fallbackUrl={stop.dualImages[0].fallbackUrl}
                                alt={stop.dualImages[0].alt}
                                aspectRatio="1:1"
                                className="h-full w-full object-cover"
                                containerClassName="h-full w-full rounded-full"
                              />
                            </div>
                          </div>

                          {/* 4b: Church crowns */}
                          <div
                            className="rounded-full flex items-center justify-center shrink-0 relative z-20 -ms-[34px]"
                            style={{
                              width: "clamp(160px, 22vw, 250px)",
                              height: "clamp(160px, 22vw, 250px)",
                              border: "2px solid var(--journey-line)",
                              padding: "7px",
                              transition: "border-color 1.4s ease",
                            }}
                          >
                            <div className="journey-photo-grade relative w-full h-full rounded-full overflow-hidden">
                              <CloudinaryImage
                                publicId={stop.dualImages[1].cloudinaryPublicId}
                                fallbackUrl={stop.dualImages[1].fallbackUrl}
                                alt={stop.dualImages[1].alt}
                                aspectRatio="1:1"
                                className="h-full w-full object-cover"
                                containerClassName="h-full w-full rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ) : stop.image ? (
                        // Single circular photo: diameter clamp(200px, 28vw, 340px)
                        <div
                          className="rounded-full flex items-center justify-center shrink-0"
                          style={{
                            width: "clamp(200px, 28vw, 340px)",
                            height: "clamp(200px, 28vw, 340px)",
                            border: "2px solid var(--journey-line)",
                            padding: "7px",
                            transition: "border-color 1.4s ease",
                          }}
                        >
                          <div className="journey-photo-grade relative w-full h-full rounded-full overflow-hidden">
                            <CloudinaryImage
                              publicId={stop.image.cloudinaryPublicId}
                              fallbackUrl={stop.image.fallbackUrl}
                              alt={stop.image.alt}
                              aspectRatio="1:1"
                              className="h-full w-full object-cover"
                              containerClassName="h-full w-full rounded-full"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* ─── 2. TITLE BLOCK (Under Picture in Row 2) ─────────── */}
                  <div
                    className={cn(
                      "order-2 flex flex-col items-center justify-start md:row-start-2",
                      isEven
                        ? "md:col-start-2 md:items-start ps-0 md:ps-[clamp(56px,6vw,96px)]"
                        : "md:col-start-1 md:items-end pe-0 md:pe-[clamp(56px,6vw,96px)]"
                    )}
                  >
                    <div
                      className="flex justify-center w-full"
                      style={{ maxWidth: circleWidthStyle }}
                    >
                      <h3
                        className="font-display font-bold text-center mt-4 sm:mt-5"
                        style={{
                          color: "var(--journey-text)",
                          fontSize: "clamp(1.6rem, 3vw, 2.3rem)",
                          lineHeight: 1.3,
                        }}
                      >
                        {stop.title}
                      </h3>
                    </div>
                  </div>

                  {/* ─── 3. ITEMS (TEXT & CHIPS) BLOCK (Row 1 opposite Picture) ─── */}
                  <div
                    className={cn(
                      "order-3 flex flex-col justify-center mt-6 md:mt-0 md:row-start-1",
                      // Alternating sides on desktop:
                      // Odd stops: Items is in Col 2 (RTL end / left), hugging center line with start padding
                      // Even stops: Items is in Col 1 (RTL start / right), hugging center line with end padding
                      isEven
                        ? "md:col-start-1 md:items-end pe-0 md:pe-[clamp(56px,6vw,96px)]"
                        : "md:col-start-2 md:items-start ps-0 md:ps-[clamp(56px,6vw,96px)]"
                    )}
                  >
                    {stop.chips.length === 0 ? (
                      // Stop 4: rendered as a quiet paragraph with an inline-start border
                      <div
                        className="border-s-2 ps-6 py-2"
                        style={{
                          borderColor: "var(--journey-line)",
                          maxWidth: "26em",
                        }}
                      >
                        <p
                          className="leading-[1.85]"
                          style={{
                            color: "var(--journey-text)",
                            fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)",
                          }}
                        >
                          {stop.text}
                        </p>
                      </div>
                    ) : (
                      <div className="w-full max-w-[26em]">
                        {/* Description: clamp(1.05rem, 1.4vw, 1.25rem), max-width 26em */}
                        <p
                          className="leading-[1.85] text-start mb-6"
                          style={{
                            color: "var(--journey-text)",
                            fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)",
                          }}
                        >
                          {stop.text}
                        </p>

                        {/* Chips container */}
                        <div className="flex flex-wrap gap-3">
                          {stop.chips.map((chip) => {
                            const count = counts[chip.slug] ?? 0;

                            if (count > 0) {
                              const href = weddingDate
                                ? `/services/${chip.slug}?date=${encodeURIComponent(weddingDate)}`
                                : `/services/${chip.slug}`;

                              return (
                                <Link
                                  key={chip.slug}
                                  href={href}
                                  className="journey-chip"
                                >
                                  <span>{chip.label}</span>
                                  <span className="opacity-50">·</span>
                                  <span className="font-latin font-medium">
                                    {count}
                                  </span>
                                </Link>
                              );
                            }

                            // Muted chip with small plain "قريباً" word after name (no border around the word)
                            return (
                              <div
                                key={chip.slug}
                                className="journey-chip-muted"
                                aria-disabled="true"
                              >
                                <span>{chip.label}</span>
                                <span className="text-xs opacity-75">قريباً</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

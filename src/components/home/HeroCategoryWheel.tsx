"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export interface HeroWheelCategory {
  slug: string;
  label: string;
  subtitle: string;
  image: string;
  color: string;
  textColor: string;
  glowColor: string;
}

export const HERO_WHEEL_CATEGORIES: HeroWheelCategory[] = [
  {
    slug: "venues",
    label: "القاعات",
    subtitle: "قاعات أفراح وكوشة فاخرة لليلة العمر",
    image: "/images/hero-wheel/venues.webp",
    color: "#A65239",
    textColor: "#FBF8F3",
    glowColor: "rgba(166, 82, 57, 0.34)",
  },
  {
    slug: "photo-session-locations",
    label: "أماكن السيشنز",
    subtitle: "لوكيشنز تصوير خارجية وداخلية مميزة",
    image: "/images/hero-wheel/photo-sessions.webp",
    color: "#C5932C",
    textColor: "#17120F",
    glowColor: "rgba(197, 147, 44, 0.28)",
  },
  {
    slug: "hotels",
    label: "الفنادق",
    subtitle: "أجنحة تجهيز العروسين وإقامة راقية",
    image: "/images/hero-wheel/hotels.webp",
    color: "#246B62",
    textColor: "#FBF8F3",
    glowColor: "rgba(36, 107, 98, 0.32)",
  },
  {
    slug: "photographer",
    label: "المصورين",
    subtitle: "توثيق أجمل لحظات فرحك بعدسة محترفة",
    image: "/images/hero-wheel/photographers.webp",
    color: "#243A6B",
    textColor: "#FBF8F3",
    glowColor: "rgba(36, 58, 107, 0.36)",
  },
  {
    slug: "makeup-artist",
    label: "الميكب أرتيست",
    subtitle: "إطلالة عروسة ساحرة ومميزة في يومك",
    image: "/images/hero-wheel/makeup-artists.webp",
    color: "#C47F8E",
    textColor: "#17120F",
    glowColor: "rgba(196, 127, 142, 0.30)",
  },
  {
    slug: "decorations",
    label: "ديكوريشنز",
    subtitle: "كوشة وزهور وتنسيق قاعات بذوق رفيع",
    image: "/images/hero-wheel/decorations.webp",
    color: "#6E2334",
    textColor: "#FBF8F3",
    glowColor: "rgba(110, 35, 52, 0.36)",
  },
];

// Geometry constants for the 520x520 SVG coordinate space
const VIEWBOX_SIZE = 520;
const CX = VIEWBOX_SIZE / 2;
const CY = VIEWBOX_SIZE / 2;
const R_INNER = 148;
const R_OUTER = 232;
const R_TEXT = (R_INNER + R_OUTER) / 2;
const SLICE_COUNT = HERO_WHEEL_CATEGORIES.length;
const SLICE_ANGLE = 360 / SLICE_COUNT; // 60 deg
const GAP_DEG = 2.6;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function createDonutSectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
): string {
  const p1 = polarToCartesian(cx, cy, rOuter, startDeg);
  const p2 = polarToCartesian(cx, cy, rOuter, endDeg);
  const p3 = polarToCartesian(cx, cy, rInner, endDeg);
  const p4 = polarToCartesian(cx, cy, rInner, startDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;

  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

// Precompute static paths once at module load
const SECTORS = HERO_WHEEL_CATEGORIES.map((item, idx) => {
  const midDeg = -90 + idx * SLICE_ANGLE;
  const startDeg = midDeg - SLICE_ANGLE / 2 + GAP_DEG / 2;
  const endDeg = midDeg + SLICE_ANGLE / 2 - GAP_DEG / 2;
  const path = createDonutSectorPath(CX, CY, R_INNER, R_OUTER, startDeg, endDeg);
  const textPos = polarToCartesian(CX, CY, R_TEXT, midDeg);
  const textRotation = midDeg + 90;

  return {
    ...item,
    index: idx,
    midDeg,
    path,
    textX: textPos.x,
    textY: textPos.y,
    textRotation,
  };
});

// Active 12 o'clock highlight frame outline (slightly expanded around the top sector)
const ACTIVE_FRAME_PATH = createDonutSectorPath(
  CX,
  CY,
  R_INNER - 5,
  R_OUTER + 8,
  -90 - SLICE_ANGLE / 2 + GAP_DEG / 2 - 0.6,
  -90 + SLICE_ANGLE / 2 - GAP_DEG / 2 + 0.6
);

export interface HeroCategoryWheelProps {
  weddingDate?: string | null;
  providerCounts?: Record<string, number>;
  onActiveChange?: (category: HeroWheelCategory) => void;
  className?: string;
}

export function HeroCategoryWheel({
  weddingDate = null,
  providerCounts = {},
  onActiveChange,
  className,
}: HeroCategoryWheelProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [rotationDeg, setRotationDeg] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const activeCategory = HERO_WHEEL_CATEGORIES[activeIndex];

  // Notify parent when active category changes (e.g., for ambient hero tint)
  React.useEffect(() => {
    onActiveChange?.(activeCategory);
  }, [activeCategory, onActiveChange]);

  // Respect user's prefers-reduced-motion setting
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setIsPaused(true);
    }
  }, []);

  const buildCategoryHref = React.useCallback(
    (slug: string) => {
      const base = `/services/${slug}`;
      return weddingDate ? `${base}?date=${encodeURIComponent(weddingDate)}` : base;
    },
    [weddingDate]
  );

  // Rotate to next item (counter-clockwise so next clockwise sector glides to top 12 o'clock)
  const goNext = React.useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % SLICE_COUNT);
    setRotationDeg((prev) => prev - SLICE_ANGLE);
  }, []);

  // Rotate directly via shortest angular path to target slice index
  const selectSlice = React.useCallback(
    (targetIdx: number) => {
      if (targetIdx === activeIndex) {
        router.push(buildCategoryHref(HERO_WHEEL_CATEGORIES[targetIdx].slug));
        return;
      }

      let diff = targetIdx - activeIndex;
      if (diff > SLICE_COUNT / 2) diff -= SLICE_COUNT;
      if (diff < -SLICE_COUNT / 2) diff += SLICE_COUNT;

      setActiveIndex(targetIdx);
      setRotationDeg((prev) => prev - diff * SLICE_ANGLE);
    },
    [activeIndex, buildCategoryHref, router]
  );

  // Auto-rotate timer (snappy interval)
  React.useEffect(() => {
    if (isPaused || isHovered) return;
    const timer = window.setInterval(() => {
      goNext();
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPaused, isHovered, goNext]);

  const activeHref = buildCategoryHref(activeCategory.slug);

  return (
    <div
      className={cn("flex flex-col items-center select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Wheel Container */}
      <div className="relative w-[310px] h-[310px] sm:w-[390px] sm:h-[390px] lg:w-[410px] lg:h-[410px] xl:w-[450px] xl:h-[450px]">
        {/* Soft ambient halo behind wheel matching active category color */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-4 rounded-full blur-3xl transition-colors duration-700"
          style={{ backgroundColor: activeCategory.glowColor }}
        />

        {/* Layer 1: Rotating Donut Ring SVG */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `rotate(${rotationDeg}deg)`,
            transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <svg
            viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
            className="h-full w-full overflow-visible drop-shadow-[0_14px_30px_rgba(0,0,0,0.45)]"
            role="group"
            aria-label="عجلة خدمات مقدمي الأفراح"
          >
            {SECTORS.map((sector) => {
              const isActive = sector.index === activeIndex;
              return (
                <g
                  key={sector.slug}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    isActive
                      ? `تصفح ${sector.label}`
                      : `اختيار ${sector.label}`
                  }
                  aria-pressed={isActive}
                  onClick={() => selectSlice(sector.index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectSlice(sector.index);
                    }
                  }}
                  className="cursor-pointer outline-none transition-all duration-300 hover:brightness-110 focus-visible:brightness-125"
                >
                  <path
                    d={sector.path}
                    fill={sector.color}
                    fillOpacity={isActive ? 1 : 0.92}
                    className="transition-opacity duration-300"
                  />
                  <text
                    x={sector.textX}
                    y={sector.textY}
                    fill={sector.textColor}
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${sector.textRotation.toFixed(2)} ${sector.textX.toFixed(2)} ${sector.textY.toFixed(2)})`}
                    className="pointer-events-none font-display font-bold"
                    style={{
                      fontSize: sector.label.length > 9 ? "16.5px" : "19px",
                      direction: "rtl",
                      unicodeBidi: "plaintext",
                      letterSpacing: "0px",
                    }}
                  >
                    {sector.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Layer 2: Fixed 12 o'clock Indicator Outline + Top Pointer Tick */}
        <svg
          viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-10"
        >
          {/* Crisp pointer tick at 12 o'clock */}
          <line
            x1={CX}
            y1={6}
            x2={CX}
            y2={34}
            stroke="#FBF8F3"
            strokeWidth={2.2}
            strokeLinecap="round"
            className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
          />
          {/* Highlight outline framing the top active slice */}
          <path
            d={ACTIVE_FRAME_PATH}
            fill="none"
            stroke="#FBF8F3"
            strokeWidth={2}
            strokeOpacity={0.95}
            className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
          />
        </svg>

        {/* Layer 3: Fixed Center Circular Photo Window */}
        <Link
          href={activeHref}
          aria-label={`تصفح قسم ${activeCategory.label}`}
          className="group absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 w-[52.5%] h-[52.5%] rounded-full overflow-hidden border-2 border-[#FBF8F3]/25 shadow-[0_16px_40px_rgba(0,0,0,0.65)] ring-4 ring-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {/* Stacked images for flicker-free crossfade */}
          {HERO_WHEEL_CATEGORIES.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <img
                key={item.slug}
                src={item.image}
                alt={item.label}
                loading={idx === 0 ? "eager" : "lazy"}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-out",
                  isActive
                    ? "opacity-100 scale-100 group-hover:scale-105"
                    : "opacity-0 scale-110 pointer-events-none"
                )}
              />
            );
          })}

          {/* Subtle bottom vignette & active label inside center window */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-300 group-hover:from-black/85" />

          <div className="absolute inset-x-3 bottom-3 sm:bottom-4 flex flex-col items-center text-center">
            <span className="font-display text-sm sm:text-base font-bold text-[#FBF8F3] drop-shadow-sm leading-tight">
              {activeCategory.label}
            </span>
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-accent-text opacity-90 transition-transform duration-200 group-hover:-translate-x-0.5">
              <span>تصفح القسم</span>
              <ArrowLeft className="h-3 w-3" weight="bold" />
            </span>
          </div>
        </Link>
      </div>

      {/* Subtle counter & active subtitle */}
      <div className="mt-4 flex items-center gap-2 text-xs text-text-muted/90">
        <span className="font-latin tracking-widest text-accent-text font-semibold">
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(SLICE_COUNT).padStart(2, "0")}
        </span>
        <span aria-hidden="true" className="opacity-40">
          ·
        </span>
        <span className="transition-opacity duration-300">
          {activeCategory.subtitle}
        </span>
      </div>
    </div>
  );
}

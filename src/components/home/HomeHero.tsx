"use client";

import * as React from "react";
import { Container } from "@/components/ui/container";
import { PublicHeader } from "@/components/layout/PublicHeader";
import {
  HomeSearchCard,
  type HomeSearchCategory,
} from "@/components/marketplace/home-search-card";
import {
  HeroCategoryWheel,
  HERO_WHEEL_CATEGORIES,
  type HeroWheelCategory,
} from "@/components/home/HeroCategoryWheel";
import { homeContent } from "@/content/home";

export interface HomeHeroProps {
  backgroundLayer: React.ReactNode;
  configHint?: React.ReactNode;
  categories: HomeSearchCategory[];
  providerCounts: Record<string, number>;
  weddingDate: string | null;
}

export function HomeHero({
  backgroundLayer,
  configHint,
  categories,
  providerCounts,
  weddingDate,
}: HomeHeroProps) {
  const [activeCategory, setActiveCategory] = React.useState<HeroWheelCategory>(
    HERO_WHEEL_CATEGORIES[0]
  );

  return (
    <section
      data-theme="dark"
      style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
      className="relative w-full overflow-hidden bg-surface text-text"
    >
      {/* Background Layer (Hero Image + Dynamic Category Color Mood Wash) */}
      <div className="absolute inset-0 z-0">
        {backgroundLayer}

        {/* Subtle ambient color wash synced with the active wheel category */}
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-colors duration-1000 ease-out mix-blend-multiply opacity-40"
          style={{ backgroundColor: activeCategory.color }}
        />

        {/* Soft radial spotlight behind the left wheel */}
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background: `radial-gradient(circle at 24% 55%, ${activeCategory.glowColor} 0%, transparent 55%)`,
          }}
        />

        {/* Scrim for contrast while keeping hero photography clear */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/40 to-[#17120F]" />
      </div>

      {/* Development configuration note if hero image missing */}
      {configHint}

      {/* Transparent Header */}
      <div className="relative z-20">
        <PublicHeader variant="transparent" initialWeddingDate={weddingDate} />
      </div>

      {/* Hero Main Split Section: Right = Brand/Title + Search, Left = Interactive Wheel (in RTL) */}
      <div className="relative z-10 py-12 sm:py-16 lg:py-20 xl:py-24">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-8 xl:gap-12">
            {/* RIGHT SIDE (RTL Start): Title, Description, Search Engine */}
            <div className="lg:col-span-6 xl:col-span-7 text-center lg:text-start">
              <div>
                <span className="font-latin text-xs font-semibold tracking-[0.18em] text-accent-text uppercase drop-shadow-xs">
                  {homeContent.hero.eyebrow}
                </span>
                <h1 className="mt-4 font-display text-3xl sm:text-5xl xl:text-[3.5rem] font-bold text-text leading-[1.22] drop-shadow-sm">
                  {homeContent.hero.title}
                </h1>
                <p className="mt-5 text-sm sm:text-base text-text-muted leading-[1.85] max-w-2xl mx-auto lg:mx-0 drop-shadow-xs">
                  {homeContent.hero.paragraph}
                </p>
              </div>

              {/* Compact Search Card (unchanged) */}
              <div className="mt-8 sm:mt-10 text-start">
                <HomeSearchCard
                  categories={categories}
                  initialWeddingDate={weddingDate}
                />
              </div>
            </div>

            {/* LEFT SIDE (RTL End): Interactive 6-Category Rotating Wheel */}
            <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end">
              <HeroCategoryWheel
                weddingDate={weddingDate}
                providerCounts={providerCounts}
                onActiveChange={setActiveCategory}
              />
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

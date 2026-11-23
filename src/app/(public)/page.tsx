import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Sparkle,
  ChatCircle,
  Check,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "@/lib/provider-visibility";
import { getWeddingDateFromCookie, validateWeddingDate } from "@/lib/wedding-date";
import { brand, isBrandConfigured } from "@/lib/brand";
import { getBaseAppUrl, safeJsonLdString } from "@/lib/seo";
import { homeContent } from "@/content/home";
import type { PublicProviderCardData } from "@/lib/marketplace-query";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { Placeholder } from "@/components/ui/placeholder";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { BrandConfigHint } from "@/components/brand/brand-config-hint";
import { HomeHero } from "@/components/home/HomeHero";
import { JourneySection } from "@/components/home/JourneySection";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseAppUrl();
  return {
    title: homeContent.seo.title,
    description: homeContent.seo.description,
    alternates: {
      canonical: `${baseUrl}/`,
    },
    openGraph: {
      title: homeContent.seo.title,
      description: homeContent.seo.description,
      url: `${baseUrl}/`,
      siteName: brand.name.ar,
      locale: "ar_EG",
      type: "website",
    },
  };
}

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage(props: HomePageProps = {}) {
  const resolvedSearchParams = props.searchParams ? await props.searchParams : undefined;
  const rawDateParam =
    typeof resolvedSearchParams?.date === "string" ? resolvedSearchParams.date : undefined;

  let weddingDate: string | null = null;
  if (rawDateParam) {
    const val = await validateWeddingDate(rawDateParam);
    if (val.valid && val.normalized) {
      weddingDate = val.normalized;
    }
  }

  if (!weddingDate) {
    weddingDate = await getWeddingDateFromCookie();
  }

  const baseUrl = getBaseAppUrl();

  // 1. Fetch active categories with at least one visible provider
  const categoriesWithProviders = await prisma.category.findMany({
    where: {
      isActive: true,
      providers: {
        some: {
          provider: visibleProviderWhere(),
        },
      },
    },
    select: {
      id: true,
      slug: true,
      nameAr: true,
      _count: {
        select: {
          providers: {
            where: {
              provider: visibleProviderWhere(),
            },
          },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // 2. Check if platform has any provider with at least one approved review
  const hasApprovedReview = await prisma.review.findFirst({
    where: {
      status: "APPROVED",
      provider: visibleProviderWhere(),
    },
    select: { id: true },
  });

  // 3. Query up to 6 visible providers
  const providersRaw = await prisma.provider.findMany({
    where: visibleProviderWhere(),
    orderBy: hasApprovedReview
      ? [{ rankScore: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }],
    take: 6,
    select: {
      id: true,
      slug: true,
      name: true,
      district: true,
      logoUrl: true,
      coverUrl: true,
      averageRating: true,
      reviewCount: true,
      rankScore: true,
      createdAt: true,
      categories: {
        select: {
          isPrimary: true,
          category: {
            select: {
              id: true,
              slug: true,
              nameAr: true,
            },
          },
        },
      },
      offers: {
        where: { isActive: true },
        select: { price: true },
      },
    },
  });

  const providers: PublicProviderCardData[] = providersRaw.map((p) => {
    const pCat = p.categories.find((c) => c.isPrimary) || p.categories[0];
    const prices = p.offers
      .map((o) => o.price)
      .filter((price): price is number => typeof price === "number");
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      district: p.district,
      logoUrl: p.logoUrl,
      coverUrl: p.coverUrl,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      rankScore: p.rankScore,
      createdAt: p.createdAt,
      primaryCategory: pCat ? pCat.category : null,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
    };
  });

  // JSON-LD structured data
  const sameAs: string[] = [];
  if (isBrandConfigured(brand.facebookUrl)) sameAs.push(brand.facebookUrl!);
  if (isBrandConfigured(brand.instagramUrl)) sameAs.push(brand.instagramUrl!);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: brand.name.ar,
        url: baseUrl,
        description: homeContent.seo.description,
        inLanguage: "ar-EG",
      },
      {
        "@type": "Organization",
        name: brand.name.ar,
        alternateName: brand.name.en,
        url: baseUrl,
        description: brand.description,
        ...(sameAs.length > 0 ? { sameAs } : {}),
      },
    ],
  };

  const hasHeroImage = isBrandConfigured(brand.heroImagePublicId);

  const providerCountsBySlug = Object.fromEntries(
    categoriesWithProviders.map((c) => [c.slug, c._count.providers])
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(jsonLd) }}
      />

      {/* 1. HERO (Dark Theme, Split Layout with Interactive 6-Category Wheel) */}
      <HomeHero
        backgroundLayer={
          hasHeroImage ? (
            <CloudinaryImage
              publicId={brand.heroImagePublicId!}
              alt={brand.name.ar}
              aspectRatio="auto"
              containerClassName="absolute inset-0 h-full w-full"
              preset="hero"
              sizes="100vw"
              priority
              className="h-full w-full object-cover object-center opacity-85"
            />
          ) : (
            <Placeholder
              aspectRatio="16:9"
              label="YOUM EL-FARAH"
              className="h-full w-full rounded-none border-none opacity-20"
            />
          )
        }
        configHint={
          !hasHeroImage ? (
            <div className="absolute top-20 start-6 z-30 pointer-events-auto">
              <BrandConfigHint field="heroImagePublicId" />
            </div>
          ) : undefined
        }
        categories={categoriesWithProviders.map((c) => ({
          id: c.id,
          slug: c.slug,
          nameAr: c.nameAr,
        }))}
        providerCounts={providerCountsBySlug}
        weddingDate={weddingDate}
      />

      {/* 2. BRIDE'S JOURNEY */}
      <JourneySection weddingDate={weddingDate} />

      {/* 3. SERVICES INDEX (Light Theme, Typographic List) */}
      <Section spacing="default" className="border-b border-border bg-surface">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={homeContent.servicesIndex.eyebrow}
              title={homeContent.servicesIndex.title}
            />
          </Reveal>

          <div className="mt-10 sm:mt-14">
            {categoriesWithProviders.length > 0 ? (
              <div className="border-t border-border">
                {categoriesWithProviders.map((cat, idx) => (
                  <Link
                    key={cat.id}
                    href={`/services/${cat.slug}`}
                    className="group flex items-center justify-between gap-4 border-b border-border py-6 sm:py-8 transition-transform duration-200 hover:-translate-x-1"
                  >
                    <div className="flex items-baseline gap-4 sm:gap-8">
                      {/* 2-digit number in Cormorant Garamond */}
                      <span className="font-latin text-2xl sm:text-4xl font-medium text-text-muted/60 transition-colors group-hover:text-accent-text">
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      {/* Category Name */}
                      <span className="font-display text-xl sm:text-3xl font-semibold text-text transition-colors group-hover:text-accent-text">
                        {cat.nameAr}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8">
                      {/* Provider Count */}
                      <span className="text-xs sm:text-sm text-text-muted font-body">
                        {cat._count.providers}{" "}
                        {cat._count.providers === 1
                          ? "مقدم خدمة"
                          : homeContent.servicesIndex.providerCountSuffix}
                      </span>

                      {/* Arrow Left (RTL forward direction) */}
                      <ArrowLeft
                        className="h-5 w-5 text-text-muted transition-all duration-200 group-hover:text-accent-text group-hover:-translate-x-1"
                        weight="light"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title={homeContent.servicesIndex.emptyState}
                className="py-12 border border-border rounded-[4px] bg-surface-raised"
              />
            )}
          </div>
        </Container>
      </Section>

      {/* 3. HOW IT WORKS (Refined Bridal 3-Step Experience) */}
      <Section spacing="default" className="border-b border-border bg-surface-raised/60 py-16 sm:py-20">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={homeContent.howItWorks.eyebrow}
              title={homeContent.howItWorks.title}
              align="center"
              className="mb-12 sm:mb-16"
            />
          </Reveal>

          {/* Steps Grid with Desktop Connector Line */}
          <div className="relative">
            {/* Desktop horizontal decorative dashed connector line */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-[52px] start-[16%] end-[16%] border-t-2 border-dashed border-[#EAE0D5] -z-0 pointer-events-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10">
              {homeContent.howItWorks.steps.map((step, idx) => {
                const StepIcon =
                  idx === 0
                    ? CalendarCheck
                    : idx === 1
                    ? Sparkle
                    : ChatCircle;

                return (
                  <Reveal key={step.number} delay={idx * 0.08}>
                    <div className="group relative flex flex-col h-full bg-white rounded-2xl border border-[#EAE0D5] p-6 sm:p-7 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                      {/* Step Number Watermark (Top-Left in RTL) */}
                      <span
                        aria-hidden="true"
                        className="absolute top-4 end-5 font-latin text-5xl sm:text-6xl font-bold text-[#EAE0D5]/50 group-hover:text-[#D8C7B5]/60 transition-colors select-none pointer-events-none leading-none"
                      >
                        {step.number}
                      </span>

                      {/* Soft Pastel / Warm-Tinted Icon Badge */}
                      <div className="relative z-10 w-12 h-12 rounded-xl bg-[#FDF6EE] border border-[#F3E7D8] flex items-center justify-center mb-5 text-[#7A5F34] shadow-xs group-hover:scale-105 group-hover:bg-[#FBEFD9] transition-all duration-300">
                        <StepIcon className="h-6 w-6" weight="regular" />
                      </div>

                      {/* Step Title */}
                      <h3 className="relative z-10 font-display text-lg sm:text-xl font-bold text-text mb-2.5">
                        {step.title}
                      </h3>

                      {/* Step Description */}
                      <p className="relative z-10 text-sm text-text-muted leading-[1.85] flex-1">
                        {step.description}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {/* Centered Bridal CTA */}
          <Reveal delay={0.25}>
            <div className="mt-12 sm:mt-14 text-center">
              <Button
                asChild
                variant="primary"
                size="lg"
                className="min-h-[48px] px-8 text-sm font-semibold shadow-xs hover:shadow-md transition-all gap-2"
              >
                <Link href="/services">
                  <span>ابدئي تصفح الخدمات الآن</span>
                  <ArrowLeft className="h-4 w-4" weight="bold" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* 4. LATEST / TOP RATED PROVIDERS (Light Theme, Omitted if no visible providers) */}
      {providers.length > 0 && (
        <Section spacing="default" className="border-b border-border bg-surface">
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-10 sm:pb-12 border-b border-border">
              <Reveal>
                <SectionHeading
                  eyebrow="DIRECTORY HIGHLIGHTS"
                  title={
                    hasApprovedReview
                      ? homeContent.latestProviders.titleTopRated
                      : homeContent.latestProviders.titleDefault
                  }
                />
              </Reveal>

              <Button asChild variant="ghost" className="gap-2 text-xs min-h-[44px]">
                <Link href="/services">
                  <span>{homeContent.latestProviders.viewAll}</span>
                  <ArrowLeft className="h-4 w-4" weight="light" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {providers.map((p, idx) => (
                <Reveal key={p.id} delay={idx * 0.04}>
                  <ProviderCard provider={p} priority={idx < 3} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* 5. VENDOR CTA BANNER (Warm Bridal Light-Luxury Feature Card) */}
      <section className="w-full bg-surface py-14 sm:py-20 border-t border-border">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-[#E8D7C5] bg-gradient-to-br from-[#FDF6EE] via-[#FAF0E6] to-[#F5E6D8] px-6 py-12 sm:px-12 sm:py-16 text-center shadow-xs">
            {/* Soft radial decorative accents */}
            <div
              className="pointer-events-none absolute -top-24 -start-24 h-64 w-64 rounded-full bg-[#B79A6B]/15 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -end-24 h-64 w-64 rounded-full bg-[#F3CDBB]/25 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative z-10 mx-auto max-w-2xl">
              <Reveal>
                <span className="inline-block rounded-full bg-white/80 border border-[#E8D7C5] px-4 py-1 text-xs font-semibold text-accent-text mb-4 shadow-2xs">
                  لمقدمي خدمات الزفاف
                </span>
                <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#17120F] leading-snug">
                  {homeContent.forProviders.title}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-[#6B625A] leading-[1.85]">
                  انضم لمنصة يوم الفرح ووصّل خدماتك لعرايس بني سويف مباشرة، اعرض أعمالك وباقاتك وأيامك المتاحة بكل سهولة ومن غير أي وسيط.
                </p>

                {/* 3 Quick Benefit Pills with Check Icons */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                  {[
                    "بدون أي عمولة",
                    "تواصل مباشر على واتساب",
                    "تنظيم مواعيدك بسهولة",
                  ].map((benefit) => (
                    <span
                      key={benefit}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/90 border border-[#E8D7C5] px-3.5 py-1.5 text-xs font-medium text-[#17120F] shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5 text-accent-text" weight="bold" />
                      <span>{benefit}</span>
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="min-h-[44px] w-full sm:w-auto px-8 rounded-full shadow-sm hover:shadow transition-all"
                  >
                    <Link href="/join">انضم كمقدم خدمة</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="min-h-[44px] w-full sm:w-auto px-6 rounded-full border-[#D4C3B2] bg-white/60 hover:bg-white text-[#17120F] transition-all"
                  >
                    <Link href="/contact">تواصل معنا</Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

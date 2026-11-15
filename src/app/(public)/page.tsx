import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "@/lib/provider-visibility";
import { getWeddingDateFromCookie } from "@/lib/wedding-date";
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
import { PublicHeader } from "@/components/layout/PublicHeader";
import { HomeSearchCard } from "@/components/marketplace/home-search-card";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { BrandConfigHint } from "@/components/brand/brand-config-hint";

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

export default async function HomePage() {
  const weddingDate = await getWeddingDateFromCookie();
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(jsonLd) }}
      />

      {/* 1. HERO (Dark Theme, Full-bleed) */}
      <section
        data-theme="dark"
        style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
        className="relative w-full overflow-hidden bg-surface text-text"
      >
        {/* Background Layer with Dark Scrim */}
        <div className="absolute inset-0 z-0">
          {hasHeroImage ? (
            <CloudinaryImage
              publicId={brand.heroImagePublicId!}
              alt={brand.name.ar}
              aspectRatio="auto"
              priority
              className="h-full w-full object-cover opacity-35"
            />
          ) : (
            <Placeholder
              aspectRatio="16:9"
              label="YOUM EL-FARAH"
              className="h-full w-full rounded-none border-none opacity-20"
            />
          )}
          {/* Dark Scrim */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-[#17120F]/90 to-[#17120F]" />
        </div>

        {/* Development configuration note if hero image missing */}
        {!hasHeroImage && (
          <div className="absolute top-20 start-6 z-30 pointer-events-auto">
            <BrandConfigHint field="heroImagePublicId" />
          </div>
        )}

        {/* Transparent Header */}
        <div className="relative z-20">
          <PublicHeader variant="transparent" initialWeddingDate={weddingDate} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 py-16 sm:py-24 lg:py-32">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <span className="font-latin text-xs font-semibold tracking-[0.18em] text-accent-text uppercase">
                  {homeContent.hero.eyebrow}
                </span>
                <h1 className="mt-4 font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-text leading-[1.25]">
                  {homeContent.hero.title}
                </h1>
                <p className="mt-6 text-sm sm:text-base text-text-muted leading-[1.85] max-w-2xl mx-auto">
                  {homeContent.hero.paragraph}
                </p>
              </Reveal>

              {/* Compact Search Card */}
              <div className="mt-10 sm:mt-12 text-start">
                <Reveal delay={150}>
                  <HomeSearchCard
                    categories={categoriesWithProviders.map((c) => ({
                      id: c.id,
                      slug: c.slug,
                      nameAr: c.nameAr,
                    }))}
                    initialWeddingDate={weddingDate}
                  />
                </Reveal>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* 2. SERVICES INDEX (Light Theme, Typographic List) */}
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

      {/* 3. HOW IT WORKS (Light Theme, Typographic 3 Columns) */}
      <Section spacing="default" className="border-b border-border bg-surface-raised">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={homeContent.howItWorks.eyebrow}
              title={homeContent.howItWorks.title}
            />
          </Reveal>

          <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 sm:gap-10">
            {homeContent.howItWorks.steps.map((step, idx) => (
              <Reveal key={step.number} delay={idx * 100}>
                <div className="flex flex-col gap-3 p-6 rounded-[4px] border border-border bg-surface transition-colors">
                  <span className="font-latin text-3xl sm:text-4xl font-medium text-accent-text">
                    {step.number}
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-text">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-[1.85]">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
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

            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((p, idx) => (
                <Reveal key={p.id} delay={idx * 80}>
                  <ProviderCard provider={p} priority={idx < 3} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* 5. FOR PROVIDERS BAND (Dark Theme) */}
      <section
        data-theme="dark"
        style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
        className="w-full bg-surface text-text border-t border-border py-16 sm:py-24"
      >
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-text leading-snug">
                {homeContent.forProviders.title}
              </h2>
              <p className="mt-4 text-sm sm:text-base text-text-muted leading-[1.85]">
                {homeContent.forProviders.paragraph}
              </p>
              <div className="mt-8">
                <Button asChild variant="primary" size="lg" className="min-h-[44px]">
                  <Link href={homeContent.forProviders.buttonHref}>
                    {homeContent.forProviders.button}
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  Sparkles,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  Star,
} from "lucide-react";
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

      {/* 4. HOW IT WORKS (Visual Mini-UI Cards Showcase) */}
      <Section spacing="default" className="border-b border-[#EFE5DA] bg-[#FAF6F0] py-16 sm:py-24">
        <Container>
          {/* Section Header */}
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCECEF] border border-rose-200/80 px-4 py-1 text-xs font-semibold text-[#9E3B52] shadow-2xs mb-3.5">
                <Sparkles className="w-3.5 h-3.5 text-[#B84A62]" />
                <span>رحلتك في 3 خطوات بسيطة</span>
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2A1E1B]">
                إزاي بتجهزي معانا
              </h2>
              <p className="mt-3.5 text-sm sm:text-base text-[#6B625A] leading-relaxed">
                كل خطوة محسوبة لتوفير وقتك وفلوسك، وتوصيلك بأفضل خدمات بني سويف بكل راحة وثقة وبدون وسيط.
              </p>
            </div>
          </Reveal>

          {/* Three Elevated Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7">
            {/* Card 01 — اختاري يوم فرحك */}
            <Reveal delay={0.05}>
              <div className="group bg-white rounded-3xl border border-[#EFE4D8] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
                {/* Top Visual Stage */}
                <div className="h-44 bg-gradient-to-br from-[#FCECEF] via-[#FFF4EE] to-[#FDF8F2] p-5 flex items-center justify-center relative overflow-hidden select-none">
                  {/* Subtle decorative background circles */}
                  <div
                    aria-hidden="true"
                    className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-rose-200/30 blur-xl pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-6 -start-6 w-24 h-24 rounded-full bg-peach-200/30 blur-xl pointer-events-none"
                  />

                  {/* Floating Mini Calendar Widget */}
                  <div className="bg-white rounded-2xl shadow-md border border-rose-100 p-3.5 w-full max-w-[220px] relative z-10 transition-transform duration-300 group-hover:scale-105">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-rose-50 text-xs">
                      <span className="font-semibold text-[#2A1E1B]">أغسطس 2026</span>
                      <CalendarCheck className="w-4 h-4 text-[#B84A62]" />
                    </div>

                    {/* Compact 7-column mini date grid */}
                    <div className="grid grid-cols-7 gap-1 text-[10px] text-[#8C7A75] text-center mb-1 font-medium">
                      <span>س</span>
                      <span>ح</span>
                      <span>ن</span>
                      <span>ث</span>
                      <span>ر</span>
                      <span>خ</span>
                      <span>ج</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-[11px] text-center font-latin font-medium text-[#2A1E1B] items-center">
                      <span className="text-stone-400">11</span>
                      <span className="text-stone-400">12</span>
                      <span className="text-stone-400">13</span>
                      <span className="text-stone-400">14</span>
                      <div className="w-5 h-5 rounded-full bg-[#B84A62] text-white flex items-center justify-center font-bold text-[10px] mx-auto shadow-xs">
                        15
                      </div>
                      <span className="text-stone-400">16</span>
                      <span className="text-stone-400">17</span>
                    </div>

                    {/* Floating status chip below */}
                    <div className="mt-2.5 pt-2 border-t border-rose-50 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-semibold text-[#2A1E1B]">14 مقدم خدمة متاح</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Text Area */}
                <div className="p-6 flex flex-col flex-1">
                  <span className="inline-block self-start rounded-full bg-[#FCECEF] text-[#9E3B52] text-xs font-semibold px-2.5 py-0.5 mb-2.5">
                    الخطوة 01
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#2A1E1B] mb-2">
                    اختاري يوم فرحك
                  </h3>
                  <p className="text-sm text-[#6B625A] leading-[1.85] flex-1">
                    اعرضي المتاح بس في اليوم ده من غير ما تتصلي بعشرين حد.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Card 02 — قارني براحتك */}
            <Reveal delay={0.12}>
              <div className="group bg-white rounded-3xl border border-[#EFE4D8] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
                {/* Top Visual Stage */}
                <div className="h-44 bg-gradient-to-br from-[#FBF3E4] via-[#FFF7EC] to-[#FCEEE5] p-5 flex items-center justify-center relative overflow-hidden select-none">
                  {/* Subtle decorative background circles */}
                  <div
                    aria-hidden="true"
                    className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-amber-200/30 blur-xl pointer-events-none"
                  />

                  {/* Overlapping Mini Vendor Comparison Cards */}
                  <div className="relative w-full max-w-[220px] flex items-center justify-center">
                    {/* Background tilted card */}
                    <div
                      aria-hidden="true"
                      className="absolute -top-2.5 start-2 end-2 bg-white/70 rounded-xl border border-amber-100/70 p-2.5 shadow-xs transform rotate-3 scale-95 pointer-events-none opacity-70"
                    >
                      <div className="h-2 w-16 rounded-full bg-amber-200/70 mb-1.5" />
                      <div className="h-2 w-24 rounded-full bg-stone-200/60" />
                    </div>

                    {/* Foreground Mini Card */}
                    <div className="relative z-10 bg-white rounded-xl shadow-md border border-amber-100/90 p-3 w-full transform -rotate-1 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-2.5 w-14 rounded-full bg-gradient-to-r from-[#C4935B] to-[#F3E6D3]" />
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>موثق</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-[#2A1E1B] truncate">قاعة اللوتس الملكية</span>
                        <div
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0"
                          dir="ltr"
                        >
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>4.9</span>
                        </div>
                      </div>

                      <div className="inline-block text-[11px] font-semibold text-[#7A5F34] bg-[#FBF3E4] px-2 py-0.5 rounded-md">
                        12,000 ج.م
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Text Area */}
                <div className="p-6 flex flex-col flex-1">
                  <span className="inline-block self-start rounded-full bg-[#FBF3E4] text-[#7A5F34] text-xs font-semibold px-2.5 py-0.5 mb-2.5">
                    الخطوة 02
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#2A1E1B] mb-2">
                    قارني براحتك
                  </h3>
                  <p className="text-sm text-[#6B625A] leading-[1.85] flex-1">
                    الأعمال والعروض والأسعار في صفحة واحدة لكل مقدم خدمة.
                  </p>
                </div>
              </div>
            </Reveal>

            {/* Card 03 — كلمي مقدم الخدمة مباشرة */}
            <Reveal delay={0.19}>
              <div className="group bg-white rounded-3xl border border-[#EFE4D8] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full">
                {/* Top Visual Stage */}
                <div className="h-44 bg-gradient-to-br from-[#F3ECFA] via-[#FAF2F8] to-[#FCECEF] p-5 flex items-center justify-center relative overflow-hidden select-none">
                  {/* Subtle decorative background circles */}
                  <div
                    aria-hidden="true"
                    className="absolute -top-6 -start-6 w-24 h-24 rounded-full bg-purple-200/30 blur-xl pointer-events-none"
                  />

                  {/* Sleek Mini Direct-Chat Preview */}
                  <div className="bg-white rounded-2xl shadow-md border border-purple-100/80 p-3.5 w-full max-w-[230px] relative z-10 transition-transform duration-300 group-hover:scale-105">
                    {/* Outgoing chat bubble */}
                    <div className="bg-[#FCECEF] border border-rose-200/60 rounded-2xl rounded-tl-xs p-2.5 text-xs text-[#2A1E1B] leading-relaxed shadow-2xs">
                      أهلاً، عايزة أعرف تفاصيل باقة يوم 15 أغسطس
                    </div>

                    {/* Floating badge below */}
                    <div className="mt-2.5 flex items-center justify-center gap-1.5 bg-[#FAF2F8] border border-purple-100 rounded-full py-1 px-3 text-[11px] font-medium text-[#7E4C88]">
                      <MessageCircle className="w-3.5 h-3.5 text-[#B84A62]" />
                      <span>تواصل مباشر · بدون عمولة</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Text Area */}
                <div className="p-6 flex flex-col flex-1">
                  <span className="inline-block self-start rounded-full bg-[#F3ECFA] text-[#7E4C88] text-xs font-semibold px-2.5 py-0.5 mb-2.5">
                    الخطوة 03
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#2A1E1B] mb-2">
                    كلمي مقدم الخدمة مباشرة
                  </h3>
                  <p className="text-sm text-[#6B625A] leading-[1.85] flex-1">
                    واتساب أو اتصال، من غير وسيط ومن غير رسوم عليكِ.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Centered Bridal CTA */}
          <Reveal delay={0.25}>
            <div className="mt-12 sm:mt-16 text-center">
              <Link
                href="/services"
                className="group rounded-full bg-[#B84A62] hover:bg-[#9E3B52] text-white px-8 py-3.5 font-semibold shadow-lg shadow-rose-900/15 inline-flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>ابدئي تصفح الخدمات الآن</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* 5. LATEST / TOP RATED PROVIDERS (Light Theme, Omitted if no visible providers) */}
      {providers.length > 0 && (
        <Section spacing="default" className="border-b border-border bg-surface">
          <Container>
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-10 sm:pb-12 border-b border-border">
              <Reveal>
                <div className="flex flex-col gap-2">
                  <span className="font-latin text-xs uppercase text-[#9E3B52] font-semibold tracking-wider select-none">
                    DIRECTORY HIGHLIGHTS
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#2A1E1B] leading-tight">
                    {hasApprovedReview
                      ? homeContent.latestProviders.titleTopRated
                      : homeContent.latestProviders.titleDefault}
                  </h2>
                </div>
              </Reveal>

              <Link
                href="/services"
                className="group text-xs font-semibold text-[#B84A62] hover:text-[#9E3B52] inline-flex items-center gap-1.5 transition-colors py-2"
              >
                <span>{homeContent.latestProviders.viewAll}</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </Link>
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

      {/* 6. VENDOR CTA ("عندك خدمة أفراح في بني سويف؟") — 2-COLUMN ASYMMETRIC SPLIT */}
      <section className="w-full bg-[#FAF6F0] py-14 sm:py-20 border-t border-[#EFE5DA]">
        <Container>
          <div className="relative overflow-hidden rounded-3xl border border-[#ECCFC6] bg-gradient-to-bl from-[#FFF5F2] via-[#FDEAE6] to-[#F7E5D4] p-7 sm:p-10 lg:p-12 shadow-sm">
            {/* Ambient radial glow accents */}
            <div
              className="pointer-events-none absolute -top-24 -start-24 h-72 w-72 rounded-full bg-[#B84A62]/10 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -end-24 h-72 w-72 rounded-full bg-[#C4935B]/20 blur-3xl"
              aria-hidden="true"
            />

            {/* Subtle architectural arch line decoration */}
            <svg
              className="pointer-events-none absolute -bottom-10 start-1/2 -translate-x-1/2 w-96 h-96 opacity-10 text-[#B84A62]"
              viewBox="0 0 200 200"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M40,160 Q100,40 160,160" strokeWidth="1.5" />
              <path d="M60,160 Q100,70 140,160" strokeWidth="1" />
            </svg>

            {/* 12-Column Asymmetric Split Grid */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Right Side (lg:col-span-7 — RTL Start, Text & Actions) */}
              <div className="lg:col-span-7 flex flex-col items-start text-start">
                <Reveal>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 backdrop-blur-sm border border-rose-200/70 text-[#9E3B52] px-4 py-1 text-xs font-semibold mb-4 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#B84A62]" />
                    <span>لمقدمي خدمات الزفاف في بني سويف</span>
                  </span>

                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2A1E1B] leading-tight mb-4">
                    عندك خدمة أفراح في بني سويف؟
                  </h2>

                  <p className="text-sm sm:text-base text-[#6B625A] leading-[1.85] mb-6 max-w-xl">
                    انضم لمنصة يوم الفرح ووصل خدماتك لعرايس بني سويف مباشرة. اعرض أعمالك، باقاتك، وأيامك المتاحة بكل سهولة ومن غير أي وسيط.
                  </p>

                  {/* 3 crisp benefit items styled as clean white pills */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-8">
                    {[
                      "بدون أي عمولة",
                      "تواصل مباشر على واتساب",
                      "تنظيم مواعيدك بسهولة",
                    ].map((benefit) => (
                      <span
                        key={benefit}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-white px-3.5 py-1.5 text-xs font-medium text-[#2A1E1B] shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#B84A62] shrink-0" />
                        <span>{benefit}</span>
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3.5">
                    <Link
                      href="/join"
                      className="group rounded-full bg-[#B84A62] hover:bg-[#9E3B52] text-white px-7 py-3.5 font-semibold shadow-md shadow-rose-900/15 inline-flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>انضم كمقدم خدمة</span>
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    </Link>

                    <Link
                      href="/contact"
                      className="rounded-full bg-white/90 hover:bg-white text-[#2A1E1B] border border-[#E4CFC4] px-6 py-3.5 font-medium inline-flex items-center gap-2 transition-all shadow-xs"
                    >
                      <span>تواصل معنا</span>
                    </Link>
                  </div>
                </Reveal>
              </div>

              {/* Left Side (lg:col-span-5 — RTL End, Mini Vendor Dashboard Preview Widget) */}
              <div className="lg:col-span-5 w-full max-w-md mx-auto lg:max-w-none">
                <Reveal delay={0.15}>
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-xl shadow-rose-950/5 border border-white flex flex-col gap-4">
                    {/* Top row */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#F0E6DC]">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1 text-xs font-medium text-emerald-800">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>استفسار عروسة جديد</span>
                      </div>
                      <span className="text-xs text-[#6B625A] font-medium">الآن</span>
                    </div>

                    {/* Content: Mock bride request snippet */}
                    <div className="bg-[#FAF5F0] rounded-xl p-3.5 border border-[#EFE5DA] flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#FCECEF] flex items-center justify-center text-[#B84A62] shrink-0">
                        <CalendarCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-[#2A1E1B]">استفسار جديد عن التوفر</div>
                        <div className="text-xs text-[#6B625A] mt-0.5 leading-relaxed">
                          عروسة بتسأل عن التوفر ليوم 18 سبتمبر — قاعة / باقة كاملة
                        </div>
                      </div>
                    </div>

                    {/* Bottom stat tiles row */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-[#FCFAF8] rounded-xl p-3 border border-[#EFE5DA] text-center shadow-xs">
                        <div className="flex items-center justify-center gap-1 text-[#B84A62] mb-1">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="font-bold text-lg font-latin">0%</span>
                        </div>
                        <span className="text-xs text-[#6B625A]">عمولة المنصة</span>
                      </div>

                      <div className="bg-[#FCFAF8] rounded-xl p-3 border border-[#EFE5DA] text-center shadow-xs">
                        <div className="flex items-center justify-center gap-1 text-[#128C7E] mb-1">
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-bold text-base">مباشر</span>
                        </div>
                        <span className="text-xs text-[#6B625A]">تواصل واتساب</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

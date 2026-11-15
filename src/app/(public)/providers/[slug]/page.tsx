import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Warning,
  InstagramLogo,
  FacebookLogo,
  Phone,
  Tag,
  CalendarCheck,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth-helpers";
import {
  checkProviderVisibility,
  visibleProviderWhere,
} from "@/lib/provider-visibility";
import { getWeddingDateFromCookie } from "@/lib/wedding-date";
import { prismaDateToDateString } from "@/lib/calendar-dates";
import { DISTRICT_LABELS } from "@/lib/districts";
import { formatMoney } from "@/lib/format-money";
import { buildWhatsAppUrl, normalizeWhatsAppDigits } from "@/lib/whatsapp";
import { resolveCloudinaryDisplayUrl } from "@/lib/cloudinary-url";
import { getBaseAppUrl, safeJsonLdString } from "@/lib/seo";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";
import { Placeholder } from "@/components/ui/placeholder";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { ProviderGallery } from "@/components/marketplace/provider-gallery";
import { ProviderAvailabilityCalendar } from "@/components/marketplace/provider-availability-calendar";
import { ProviderContactActions } from "@/components/marketplace/provider-contact-actions";

export const revalidate = 300;

interface ProviderProfileProps {
  params: Promise<{ slug: string }>;
}

async function getProviderForProfile(slug: string) {
  return prisma.provider.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      userId: true,
      name: true,
      bio: true,
      district: true,
      address: true,
      phone: true,
      whatsapp: true,
      instagramUrl: true,
      facebookUrl: true,
      logoUrl: true,
      coverUrl: true,
      coverPublicId: true,
      status: true,
      averageRating: true,
      reviewCount: true,
      createdAt: true,
      updatedAt: true,
      categories: {
        select: {
          isPrimary: true,
          category: {
            select: { id: true, slug: true, nameAr: true },
          },
        },
      },
      offers: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
        },
      },
      media: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          url: true,
          cloudinaryPublicId: true,
          caption: true,
        },
      },
      blockedDates: {
        select: { date: true },
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        select: {
          status: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: ProviderProfileProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProviderForProfile(slug);
  if (!provider) {
    return { title: "مقدم الخدمة غير موجود" };
  }

  const primaryCategory =
    provider.categories.find((c) => c.isPrimary)?.category ||
    provider.categories[0]?.category;
  const primaryCatName = primaryCategory ? primaryCategory.nameAr : "خدمات الأفراح";
  const districtName = DISTRICT_LABELS[provider.district] || provider.district;

  const baseUrl = getBaseAppUrl();
  const canonicalUrl = `${baseUrl}/providers/${provider.slug}`;

  const cleanBio = provider.bio
    ? provider.bio.replace(/\s+/g, " ").slice(0, 155).trim()
    : `${provider.name} - ${primaryCatName} في ${districtName}، بني سويف. تفاصيل الخدمات والباقات وتأكيد الحجز المباشر.`;

  // Open Graph Image (1200x630 with Cloudinary c_fill or fallback)
  let ogImageUrl = `${baseUrl}/og-default.jpg`;
  if (provider.coverPublicId) {
    const cloudinaryOg = resolveCloudinaryDisplayUrl({
      publicId: provider.coverPublicId,
      fallbackUrl: provider.coverUrl,
      preset: "og",
    });
    if (cloudinaryOg) ogImageUrl = cloudinaryOg;
  } else if (provider.coverUrl) {
    ogImageUrl = provider.coverUrl;
  }

  return {
    title: `${provider.name} | ${primaryCatName} في بني سويف`,
    description: cleanBio,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${provider.name} | ${primaryCatName} في بني سويف`,
      description: cleanBio,
      url: canonicalUrl,
      siteName: "يوم الفرح",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: provider.name,
        },
      ],
      locale: "ar_EG",
      type: "website",
    },
  };
}

export default async function ProviderProfilePage({
  params,
}: ProviderProfileProps) {
  const { slug } = await params;
  const provider = await getProviderForProfile(slug);
  if (!provider) {
    notFound();
  }

  // Visibility Check: Non-visible providers return 404 UNLESS user is owner or ADMIN
  const visibility = checkProviderVisibility(provider);
  let isPreviewMode = false;

  if (!visibility.isVisible) {
    const session = await getSession();
    const isOwner = session?.user?.id === provider.userId;
    const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      notFound();
    }
    isPreviewMode = true;
  }

  const weddingDate = await getWeddingDateFromCookie();
  const districtName = DISTRICT_LABELS[provider.district] || provider.district;
  const primaryCategory =
    provider.categories.find((c) => c.isPrimary)?.category ||
    provider.categories[0]?.category;

  // WhatsApp & Phone urls
  const whatsappUrl = buildWhatsAppUrl({
    whatsapp: provider.whatsapp,
    phone: provider.phone,
    date: weddingDate,
  });
  const phoneDigits = normalizeWhatsAppDigits(provider.phone) || provider.phone;

  // Blocked dates mapped to YYYY-MM-DD
  const blockedDatesStrings = provider.blockedDates.map((b) =>
    prismaDateToDateString(b.date)
  );

  // Similar Providers: Up to 4 visible providers in the same primary category
  let similarProvidersCards: Array<import("@/lib/marketplace-query").PublicProviderCardData> = [];
  if (primaryCategory) {
    const similarRaw = await prisma.provider.findMany({
      where: {
        id: { not: provider.id },
        ...visibleProviderWhere(),
        categories: {
          some: {
            categoryId: primaryCategory.id,
          },
        },
      },
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
            category: { select: { id: true, slug: true, nameAr: true } },
          },
        },
        offers: {
          where: { isActive: true },
          select: { price: true },
        },
      },
      orderBy: [{ rankScore: "desc" }, { createdAt: "desc" }],
      take: 8,
    });

    // Prioritize same district, take 4
    const sameDist = similarRaw.filter((p) => p.district === provider.district);
    const otherDist = similarRaw.filter((p) => p.district !== provider.district);
    similarProvidersCards = [...sameDist, ...otherDist].slice(0, 4).map((p) => {
      const pCat = p.categories.find((c) => c.isPrimary) || p.categories[0];
      const prices = p.offers
        .map((o) => o.price)
        .filter((pr): pr is number => typeof pr === "number" && pr !== null);
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
  }

  const baseUrl = getBaseAppUrl();

  // JSON-LD LocalBusiness & BreadcrumbList
  const socialLinks: string[] = [];
  if (provider.instagramUrl) socialLinks.push(provider.instagramUrl);
  if (provider.facebookUrl) socialLinks.push(provider.facebookUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "الرئيسية",
            item: baseUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "خدمات الأفراح",
            item: `${baseUrl}/services`,
          },
          ...(primaryCategory
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: primaryCategory.nameAr,
                  item: `${baseUrl}/services/${primaryCategory.slug}`,
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: provider.name,
                  item: `${baseUrl}/providers/${provider.slug}`,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: provider.name,
                  item: `${baseUrl}/providers/${provider.slug}`,
                },
              ]),
        ],
      },
      {
        "@type": "LocalBusiness",
        name: provider.name,
        url: `${baseUrl}/providers/${provider.slug}`,
        ...(provider.logoUrl || provider.coverUrl
          ? { image: provider.coverUrl || provider.logoUrl }
          : {}),
        address: {
          "@type": "PostalAddress",
          addressLocality: districtName,
          addressRegion: "بني سويف",
          addressCountry: "EG",
          ...(provider.address ? { streetAddress: provider.address } : {}),
        },
        areaServed: "Beni Suef",
        ...(provider.phone ? { telephone: provider.phone } : {}),
        ...(socialLinks.length > 0 ? { sameAs: socialLinks } : {}),
        ...(provider.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: provider.averageRating,
                reviewCount: provider.reviewCount,
              },
            }
          : {}),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(jsonLd) }}
      />

      {/* PREVIEW BANNER (FOR ADMIN / OWNER ONLY) */}
      {isPreviewMode && (
        <aside
          role="status"
          aria-live="polite"
          className="sticky top-0 z-50 flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/15 px-4 py-3 text-center text-sm font-semibold text-warning"
        >
          <Warning className="h-5 w-5 shrink-0" weight="fill" />
          <span>
            معاينة: هذا الملف غير ظاهر للعامة — {visibility.reason}
          </span>
        </aside>
      )}

      {/* (1) DARK-THEME HERO BAND */}
      <section
        data-theme="dark"
        style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
        className="relative w-full overflow-hidden bg-surface text-text"
      >
        {/* Full-bleed cover with dark scrim */}
        <div className="absolute inset-0 z-0">
          {provider.coverUrl ? (
            <CloudinaryImage
              publicId={provider.coverPublicId}
              src={provider.coverUrl}
              alt={provider.name}
              aspectRatio="auto"
              priority
              className="h-full w-full object-cover opacity-35"
            />
          ) : (
            <Placeholder
              aspectRatio="16:9"
              label={provider.name}
              className="h-full w-full rounded-none border-none opacity-25"
            />
          )}
          {/* Dark Scrim */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#17120F]/90 to-[#17120F]" />
        </div>

        {/* Transparent PublicHeader */}
        <div className="relative z-20">
          <PublicHeader variant="transparent" initialWeddingDate={weddingDate} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 py-12 sm:py-16 lg:py-20">
          <Container>
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 sm:gap-8">
              {/* Logo Avatar */}
              <Avatar className="h-24 w-24 sm:h-28 sm:w-28 rounded-[8px] border-2 border-white/20 shadow-xl bg-surface-raised shrink-0">
                {provider.logoUrl ? (
                  <AvatarImage src={provider.logoUrl} alt={provider.name} />
                ) : null}
                <AvatarFallback className="text-2xl font-display font-bold text-text">
                  {provider.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0">
                {/* Category Chips */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {provider.categories.map((c) => (
                    <Badge
                      key={c.category.id}
                      variant={c.isPrimary ? "accent" : "neutral"}
                      size="sm"
                    >
                      {c.category.nameAr}
                    </Badge>
                  ))}
                  <span className="flex items-center gap-1 text-xs text-white/80 ms-2">
                    <MapPin className="h-3.5 w-3.5 text-accent-text" weight="fill" />
                    <span>{districtName}</span>
                    {provider.address && (
                      <span className="text-white/60">• {provider.address}</span>
                    )}
                  </span>
                </div>

                {/* Name */}
                <h1 className="font-display text-display font-bold text-white tracking-tight leading-tight">
                  {provider.name}
                </h1>

                {/* Rating Summary (ONLY when reviewCount > 0) */}
                {provider.reviewCount > 0 ? (
                  <div className="mt-3 flex items-center gap-2">
                    <Rating
                      value={provider.averageRating}
                      count={provider.reviewCount}
                      size="md"
                    />
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <Sparkle className="h-4 w-4 text-accent-text" weight="light" />
                    <span>مقدم خدمة معتمد في دليل يوم الفرح</span>
                  </div>
                )}
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* (2) CONTACT ACTIONS & VIEW TRACKING */}
      <section className="border-b border-border bg-surface-raised py-6">
        <Container className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted hidden sm:inline">
              للاستفسار والحجز المباشر:
            </span>
            <ProviderContactActions
              providerId={provider.id}
              whatsappUrl={whatsappUrl}
              phoneDigits={phoneDigits}
            />
          </div>

          {/* (8) Social Links as text links */}
          <div className="flex items-center gap-4 text-xs">
            {provider.instagramUrl && (
              <a
                href={provider.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-text-muted hover:text-text transition-colors"
              >
                <InstagramLogo className="h-4 w-4 text-accent-text" />
                <span>إنستغرام</span>
              </a>
            )}
            {provider.facebookUrl && (
              <a
                href={provider.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-text-muted hover:text-text transition-colors"
              >
                <FacebookLogo className="h-4 w-4 text-accent-text" />
                <span>فيسبوك</span>
              </a>
            )}
          </div>
        </Container>
      </section>

      {/* MAIN BODY SECTIONS */}
      <div className="py-12 sm:py-16 flex flex-col gap-16">
        {/* (3) نبذة عن مقدم الخدمة */}
        {provider.bio && (
          <Section spacing="sm">
            <Container>
              <div className="max-w-3xl">
                <SectionHeading
                  eyebrow="ABOUT PROVIDER"
                  title="نبذة عن مقدم الخدمة"
                />
                <div className="mt-4 text-body text-text whitespace-pre-line leading-relaxed">
                  {provider.bio}
                </div>
              </div>
            </Container>
          </Section>
        )}

        {/* (4) العروض والباقات */}
        {provider.offers.length > 0 && (
          <Section spacing="sm" className="border-t border-border pt-12">
            <Container>
              <SectionHeading
                eyebrow="AVAILABLE PACKAGES"
                title="العروض والباقات المتاحة"
                description="قائمة بالباقات والخدمات التي يقدمها مقدم الخدمة مع تفاصيل الأسعار المعلنة."
              />

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {provider.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex flex-col justify-between rounded-[4px] border border-border bg-surface-raised p-6 transition-colors hover:border-border-strong"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display font-semibold text-base text-text">
                          {offer.title}
                        </h4>
                        <Tag className="h-4 w-4 text-accent-text shrink-0" weight="light" />
                      </div>

                      {offer.description && (
                        <p className="mt-2 text-xs text-text-muted leading-relaxed whitespace-pre-line">
                          {offer.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                      <span className="font-latin font-bold text-base text-text">
                        {offer.price !== null
                          ? formatMoney(offer.price)
                          : "تواصلي لمعرفة السعر"}
                      </span>

                      {whatsappUrl && (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="text-xs text-accent-text hover:text-accent-contrast min-h-[44px]"
                        >
                          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                            طلب الباقة
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </Section>
        )}

        {/* (5) المعرض والأعمال */}
        <Section spacing="sm" className="border-t border-border pt-12">
          <Container>
            <SectionHeading
              eyebrow="PORTFOLIO & WORK"
              title="معرض الأعمال والمناسبات"
              description="أبرز الصور والفيديوهات من واقع حفلات ومناسبات سابقة نُفّذت للعرائس."
            />

            <div className="mt-8">
              <ProviderGallery media={provider.media} providerName={provider.name} />
            </div>
          </Container>
        </Section>

        {/* (6) التوافر والجدول */}
        <Section spacing="sm" className="border-t border-border pt-12">
          <Container>
            <div className="max-w-2xl">
              <SectionHeading
                eyebrow="AVAILABILITY CALENDAR"
                title="جدول التوافر والمواعيد"
                description="استعرضي المواعيد المحجوزة والمتاحة خلال الأشهر الـ 12 القادمة. انقري على يوم فرحكِ للتأكد من التوافر وبدء التواصل."
              />

              <div className="mt-8">
                <ProviderAvailabilityCalendar
                  providerId={provider.id}
                  blockedDates={blockedDatesStrings}
                  whatsapp={provider.whatsapp}
                  phone={provider.phone}
                  initialSelectedDate={weddingDate}
                />
              </div>
            </div>
          </Container>
        </Section>

        {/* (7) مقدمو خدمة مشابهون */}
        {similarProvidersCards.length > 0 && (
          <Section spacing="sm" className="border-t border-border pt-12">
            <Container>
              <SectionHeading
                eyebrow="RECOMMENDED PROVIDERS"
                title="مقدمو خدمة مشابهون"
                description={`مقدمو خدمات آخرون في تصنيف ${primaryCategory ? primaryCategory.nameAr : "نفس المجال"} في محافظة بني سويف.`}
              />

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProvidersCards.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    activeDate={weddingDate}
                  />
                ))}
              </div>
            </Container>
          </Section>
        )}
      </div>
    </>
  );
}

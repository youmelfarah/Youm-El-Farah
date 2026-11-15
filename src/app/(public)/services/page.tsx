import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { CategoryChips } from "@/components/marketplace/category-chips";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { ListingEmptyState } from "@/components/marketplace/listing-empty-state";
import { MarketplacePagination } from "@/components/marketplace/marketplace-pagination";
import { getWeddingDateFromCookie } from "@/lib/wedding-date";
import {
  listingParamsSchema,
  queryMarketplaceProviders,
} from "@/lib/marketplace-query";
import { getBaseAppUrl, safeJsonLdString } from "@/lib/seo";

export const revalidate = 300;

interface ServicesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: ServicesPageProps): Promise<Metadata> {
  const rawParams = await searchParams;
  const parsed = listingParamsSchema.safeParse(rawParams);
  const defaultParams = {
    q: undefined,
    district: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    date: undefined,
    sort: "rating" as const,
    page: 1,
  };
  const params = parsed.success ? parsed.data : defaultParams;

  const baseUrl = getBaseAppUrl();
  const canonicalUrl = `${baseUrl}/services`;

  const hasFilterParams = Boolean(
    params.q ||
      params.district ||
      params.minPrice !== undefined ||
      params.maxPrice !== undefined ||
      params.date ||
      (params.sort && params.sort !== "rating")
  );

  return {
    title: "خدمات وتجهيزات الأفراح في بني سويف",
    description:
      "دليلكِ الشامل لاختيار أرقى خدمات وتجهيزات الزفاف في محافظة بني سويف: قاعات، مصورين، كوافير وميك أب، فساتين وأتيليهات.",
    alternates: {
      canonical: canonicalUrl,
    },
    robots: hasFilterParams
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const rawParams = await searchParams;
  const parsed = listingParamsSchema.safeParse(rawParams);
  const defaultParams = {
    q: undefined,
    district: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    date: undefined,
    sort: "rating" as const,
    page: 1,
  };
  const params = parsed.success ? parsed.data : defaultParams;

  const cookieDate = await getWeddingDateFromCookie();

  // Fetch active categories for chips
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, nameAr: true },
    orderBy: { sortOrder: "asc" },
  });

  // Query providers
  const {
    providers,
    totalCount,
    totalPages,
    currentPage,
    isDateExclusion,
    activeDate,
  } = await queryMarketplaceProviders(params, undefined, cookieDate);

  const baseUrl = getBaseAppUrl();

  // JSON-LD Structured Data
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
        ],
      },
      {
        "@type": "ItemList",
        name: "خدمات وتجهيزات الأفراح في بني سويف",
        numberOfItems: totalCount,
        itemListElement: providers.map((p, index) => ({
          "@type": "ListItem",
          position: (currentPage - 1) * 12 + index + 1,
          item: {
            "@type": "LocalBusiness",
            name: p.name,
            url: `${baseUrl}/providers/${p.slug}`,
            ...(p.logoUrl ? { image: p.logoUrl } : {}),
            ...(p.reviewCount > 0
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: p.averageRating,
                    reviewCount: p.reviewCount,
                  },
                }
              : {}),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString(jsonLd) }}
      />

      <Section spacing="none" className="border-b border-border bg-surface-raised py-8 sm:py-10">
        <Container>
          <SectionHeading
            as="h1"
            eyebrow="BENI SUEF WEDDING MARKETPLACE"
            title="خدمات وتجهيزات الأفراح في بني سويف"
            description="تصفحي وقارني بين نخبة مزودي خدمات الزفاف في جميع مراكز بني سويف، مع أسعار معلنة وتأكيد فوري لتوافر المواعيد."
          />

          <div className="mt-6">
            <CategoryChips
              categories={categories}
              searchParams={rawParams as Record<string, string | number | undefined>}
            />
          </div>
        </Container>
      </Section>

      <Section spacing="none" className="pt-6 sm:pt-8 pb-16 sm:pb-24 bg-surface">
        <Container>
          <MarketplaceFilters
            initialParams={params}
            totalCount={totalCount}
            cookieDate={cookieDate}
          >
            {providers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {providers.map((p, idx) => (
                    <ProviderCard
                      key={p.id}
                      provider={p}
                      activeDate={activeDate}
                      priority={idx < 2}
                    />
                  ))}
                </div>

                <MarketplacePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pathname="/services"
                  searchParams={rawParams as Record<string, string | number | undefined>}
                />
              </>
            ) : (
              <ListingEmptyState
                isDateExclusion={isDateExclusion}
                activeDate={activeDate}
                resetUrl="/services"
              />
            )}
          </MarketplaceFilters>
        </Container>
      </Section>
    </>
  );
}

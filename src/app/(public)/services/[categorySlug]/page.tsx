import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, slug: true, nameAr: true, isActive: true },
  });
  if (!category || !category.isActive) {
    return null;
  }
  return category;
}

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) {
    return { title: "التصنيف غير موجود" };
  }

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
  const filterParams = parsed.success ? parsed.data : defaultParams;

  const baseUrl = getBaseAppUrl();
  const canonicalUrl = `${baseUrl}/services/${category.slug}`;

  const hasFilterParams = Boolean(
    filterParams.q ||
      filterParams.district ||
      filterParams.minPrice !== undefined ||
      filterParams.maxPrice !== undefined ||
      filterParams.date ||
      (filterParams.sort && filterParams.sort !== "rating")
  );

  return {
    title: `${category.nameAr} في بني سويف | يوم الفرح`,
    description: `دليل ومقارنة أفضل ${category.nameAr} في محافظة بني سويف. تصفحي الأسعار، الصور، وتأكدي من توافر المواعيد ليوم زفافكِ.`,
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

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { categorySlug } = await params;
  const category = await getCategory(categorySlug);
  if (!category) {
    notFound();
  }

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
  const filterParams = parsed.success ? parsed.data : defaultParams;

  const cookieDate = await getWeddingDateFromCookie();

  // Fetch active categories for the chips bar
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, nameAr: true },
    orderBy: { sortOrder: "asc" },
  });

  // Query providers for this category
  const {
    providers,
    totalCount,
    totalPages,
    currentPage,
    isDateExclusion,
    activeDate,
  } = await queryMarketplaceProviders(filterParams, category.slug, cookieDate);

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
          {
            "@type": "ListItem",
            position: 3,
            name: category.nameAr,
            item: `${baseUrl}/services/${category.slug}`,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: `${category.nameAr} في بني سويف`,
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
            eyebrow="CATEGORY DIRECTORY"
            title={`${category.nameAr} في بني سويف`}
            description={`أفضل وأرقى ${category.nameAr} في مختلف مراكز محافظة بني سويف، مع أسعار الباقات وخيارات الحجز المباشر.`}
          />

          <div className="mt-6">
            <CategoryChips
              categories={categories}
              activeCategorySlug={category.slug}
              searchParams={rawParams as Record<string, string | number | undefined>}
            />
          </div>
        </Container>
      </Section>

      <Section spacing="none" className="pt-6 sm:pt-8 pb-16 sm:pb-24 bg-surface">
        <Container>
          <MarketplaceFilters
            initialParams={filterParams}
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
                  pathname={`/services/${category.slug}`}
                  searchParams={rawParams as Record<string, string | number | undefined>}
                />
              </>
            ) : (
              <ListingEmptyState
                isDateExclusion={isDateExclusion}
                activeDate={activeDate}
                resetUrl={`/services/${category.slug}`}
              />
            )}
          </MarketplaceFilters>
        </Container>
      </Section>
    </>
  );
}

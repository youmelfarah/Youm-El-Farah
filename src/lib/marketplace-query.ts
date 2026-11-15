import { z } from "zod";
import { Prisma, District } from "@prisma/client";
import { prisma } from "./prisma";
import { DISTRICT_VALUES } from "./districts";
import { getCairoTodayString, isValidDateString } from "./calendar-dates";

export const PAGE_SIZE = 12;

export const listingParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(60, "كلمة البحث يجب ألا تتجاوز 60 حرفاً")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  district: z.enum(DISTRICT_VALUES).optional(),
  minPrice: z.coerce.number().int().min(0).max(1000000).optional(),
  maxPrice: z.coerce.number().int().min(0).max(1000000).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "صيغة التاريخ غير صحيحة")
    .optional()
    .refine((val) => !val || isValidDateString(val), "تاريخ غير صالح")
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  sort: z
    .enum(["rating", "newest", "price_asc", "price_desc"])
    .default("rating")
    .catch("rating"),
  page: z.coerce.number().int().min(1).max(200).default(1).catch(1),
});

export type ValidatedListingParams = z.infer<typeof listingParamsSchema>;

export interface PublicProviderCardData {
  id: string;
  slug: string;
  name: string;
  district: District;
  logoUrl: string | null;
  coverUrl: string | null;
  averageRating: number;
  reviewCount: number;
  rankScore: number;
  createdAt: Date;
  primaryCategory: {
    id: string;
    slug: string;
    nameAr: string;
  } | null;
  minPrice: number | null;
}

export interface MarketplaceQueryResult {
  providers: PublicProviderCardData[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isDateExclusion: boolean;
  activeDate: string | null;
}

/**
 * Executes a privacy-safe, visibility-enforced search across approved providers with active subscriptions.
 */
export async function queryMarketplaceProviders(
  params: ValidatedListingParams,
  categorySlug?: string,
  cookieDate?: string | null
): Promise<MarketplaceQueryResult> {
  const activeDate = params.date || cookieDate || null;
  const now = new Date();

  // Build shared visibility conditions
  const baseConditions: Prisma.Sql[] = [
    Prisma.sql`p.status = 'APPROVED'::"ProviderStatus"`,
    Prisma.sql`EXISTS (
      SELECT 1 FROM "Subscription" s
      WHERE s."providerId" = p.id
        AND s.status = 'ACTIVE'::"SubscriptionStatus"
        AND s."startsAt" <= ${now}
        AND s."endsAt" > ${now}
    )`,
  ];

  if (categorySlug) {
    baseConditions.push(
      Prisma.sql`EXISTS (
        SELECT 1 FROM "ProviderCategory" pc
        JOIN "Category" c ON c.id = pc."categoryId"
        WHERE pc."providerId" = p.id
          AND c.slug = ${categorySlug}
          AND c."isActive" = true
      )`
    );
  }

  if (params.district) {
    baseConditions.push(Prisma.sql`p.district = ${params.district}::"District"`);
  }

  if (params.minPrice !== undefined) {
    baseConditions.push(
      Prisma.sql`EXISTS (
        SELECT 1 FROM "Offer" o
        WHERE o."providerId" = p.id
          AND o."isActive" = true
          AND o.price >= ${params.minPrice}
      )`
    );
  }

  if (params.maxPrice !== undefined) {
    baseConditions.push(
      Prisma.sql`EXISTS (
        SELECT 1 FROM "Offer" o
        WHERE o."providerId" = p.id
          AND o."isActive" = true
          AND o.price <= ${params.maxPrice}
      )`
    );
  }

  if (params.q) {
    const qPattern = `%${params.q}%`;
    baseConditions.push(Prisma.sql`p.name ILIKE ${qPattern}`);
  }

  // Conditions with date
  const filteredConditions = [...baseConditions];
  if (activeDate) {
    filteredConditions.push(
      Prisma.sql`NOT EXISTS (
        SELECT 1 FROM "BlockedDate" bd
        WHERE bd."providerId" = p.id
          AND bd.date = ${activeDate}::date
      )`
    );
  }

  const whereClause = Prisma.sql`WHERE ${Prisma.join(filteredConditions, " AND ")}`;

  // Determine ORDER BY
  let orderByClause: Prisma.Sql;
  if (params.sort === "newest") {
    orderByClause = Prisma.sql`ORDER BY p."createdAt" DESC`;
  } else if (params.sort === "price_asc") {
    orderByClause = Prisma.sql`ORDER BY (SELECT MIN(o.price) FROM "Offer" o WHERE o."providerId" = p.id AND o."isActive" = true) ASC NULLS LAST, p."rankScore" DESC`;
  } else if (params.sort === "price_desc") {
    orderByClause = Prisma.sql`ORDER BY (SELECT MIN(o.price) FROM "Offer" o WHERE o."providerId" = p.id AND o."isActive" = true) DESC NULLS LAST, p."rankScore" DESC`;
  } else {
    // Default: rating with deterministic daily shuffle
    const cairoDateStr = getCairoTodayString();
    orderByClause = Prisma.sql`ORDER BY p."rankScore" DESC, md5(p.id || ${cairoDateStr}) ASC`;
  }

  // Count query
  const countRows = await prisma.$queryRaw<Array<{ count: number }>>(
    Prisma.sql`SELECT COUNT(*)::int AS count FROM "Provider" p ${whereClause}`
  );
  const totalCount = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(params.page, totalPages);
  const offset = (currentPage - 1) * PAGE_SIZE;

  // Check if date filter specifically excluded all results
  let isDateExclusion = false;
  if (totalCount === 0 && activeDate) {
    const withoutDateWhere = Prisma.sql`WHERE ${Prisma.join(baseConditions, " AND ")}`;
    const withoutDateCountRows = await prisma.$queryRaw<Array<{ count: number }>>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM "Provider" p ${withoutDateWhere}`
    );
    const withoutDateCount = Number(withoutDateCountRows[0]?.count ?? 0);
    if (withoutDateCount > 0) {
      isDateExclusion = true;
    }
  }

  if (totalCount === 0) {
    return {
      providers: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      isDateExclusion,
      activeDate,
    };
  }

  // Query IDs for the current page
  const idRows = await prisma.$queryRaw<Array<{ id: string }>>(
    Prisma.sql`SELECT p.id FROM "Provider" p ${whereClause} ${orderByClause} LIMIT ${PAGE_SIZE} OFFSET ${offset}`
  );
  const ids = idRows.map((r) => r.id);

  if (ids.length === 0) {
    return {
      providers: [],
      totalCount,
      totalPages,
      currentPage,
      isDateExclusion,
      activeDate,
    };
  }

  // Load full records using Prisma with strict explicit select for privacy
  const records = await prisma.provider.findMany({
    where: { id: { in: ids } },
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
        select: {
          price: true,
        },
      },
    },
  });

  // Preserve exact ordering from raw SQL query
  const map = new Map(records.map((r) => [r.id, r]));
  const orderedRecords = ids.map((id) => map.get(id)).filter(Boolean);

  const providers: PublicProviderCardData[] = orderedRecords.map((r) => {
    const primaryCatRel = r!.categories.find((c) => c.isPrimary) || r!.categories[0];
    const prices = r!.offers
      .map((o) => o.price)
      .filter((p): p is number => typeof p === "number" && p !== null);
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    return {
      id: r!.id,
      slug: r!.slug,
      name: r!.name,
      district: r!.district,
      logoUrl: r!.logoUrl,
      coverUrl: r!.coverUrl,
      averageRating: r!.averageRating,
      reviewCount: r!.reviewCount,
      rankScore: r!.rankScore,
      createdAt: r!.createdAt,
      primaryCategory: primaryCatRel ? primaryCatRel.category : null,
      minPrice,
    };
  });

  return {
    providers,
    totalCount,
    totalPages,
    currentPage,
    isDateExclusion,
    activeDate,
  };
}

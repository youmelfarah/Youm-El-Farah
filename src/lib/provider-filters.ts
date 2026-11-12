import { Prisma, District } from "@prisma/client";
import { visibleProviderWhere } from "./provider-visibility";

export interface ProviderFilterParams {
  /** Filter by category slug */
  categorySlug?: string;
  /** Filter by district */
  district?: District;
  /** Minimum price — provider has at least one active offer with price >= minPrice */
  minPrice?: number;
  /** Maximum price — provider has at least one active offer with price <= maxPrice */
  maxPrice?: number;
  /** Date (YYYY-MM-DD) — provider has NO BlockedDate on this date */
  date?: string;
  /** Search query — case-insensitive match on provider name */
  q?: string;
}

/**
 * Builds a Prisma WHERE clause combining visibility with optional filters.
 *
 * All conditions are ANDed together.
 */
export function buildProviderWhere(
  params: ProviderFilterParams
): Prisma.ProviderWhereInput {
  const conditions: Prisma.ProviderWhereInput[] = [visibleProviderWhere()];

  if (params.categorySlug) {
    conditions.push({
      categories: {
        some: {
          category: {
            slug: params.categorySlug,
          },
        },
      },
    });
  }

  if (params.district) {
    conditions.push({
      district: params.district,
    });
  }

  // Price range filter: provider has at least one active offer with price in range
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    const priceFilter: Prisma.IntNullableFilter = {};
    if (params.minPrice !== undefined) {
      priceFilter.gte = params.minPrice;
    }
    if (params.maxPrice !== undefined) {
      priceFilter.lte = params.maxPrice;
    }

    conditions.push({
      offers: {
        some: {
          isActive: true,
          price: priceFilter,
        },
      },
    });
  }

  // Date availability filter: provider has NO BlockedDate on that date
  if (params.date) {
    const filterDate = new Date(params.date);
    conditions.push({
      blockedDates: {
        none: {
          date: filterDate,
        },
      },
    });
  }

  // Search query: case-insensitive match on provider name
  if (params.q) {
    conditions.push({
      name: {
        contains: params.q,
        mode: "insensitive",
      },
    });
  }

  return { AND: conditions };
}


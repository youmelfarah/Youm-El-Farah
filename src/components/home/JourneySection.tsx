import { prisma } from "@/lib/prisma";
import { buildProviderWhere } from "@/lib/provider-filters";
import { getWeddingDateFromCookie, validateWeddingDate } from "@/lib/wedding-date";
import { journeyContent } from "@/content/journey";
import { BrideJourney } from "./BrideJourney";

export interface JourneySectionProps {
  weddingDate?: string | null;
}

export async function JourneySection({ weddingDate: propWeddingDate }: JourneySectionProps = {}) {
  // 1. Resolve effective wedding date: prop > cookie
  let effectiveWeddingDate: string | null = null;
  if (propWeddingDate) {
    const val = await validateWeddingDate(propWeddingDate);
    if (val.valid && val.normalized) {
      effectiveWeddingDate = val.normalized;
    }
  }

  if (!effectiveWeddingDate) {
    effectiveWeddingDate = await getWeddingDateFromCookie();
  }

  // 2. Collect all unique category slugs from journey stops
  const categorySlugs = Array.from(
    new Set(journeyContent.stops.flatMap((stop) => stop.chips.map((c) => c.slug)))
  );

  // 3. Query visible provider count per category respecting wedding date
  const countEntries = await Promise.all(
    categorySlugs.map(async (slug) => {
      const where = buildProviderWhere({
        categorySlug: slug,
        date: effectiveWeddingDate || undefined,
      });

      const count = await prisma.provider.count({ where });
      return [slug, count] as const;
    })
  );

  const counts: Record<string, number> = Object.fromEntries(countEntries);

  return (
    <BrideJourney
      content={journeyContent}
      counts={counts}
      weddingDate={effectiveWeddingDate}
    />
  );
}

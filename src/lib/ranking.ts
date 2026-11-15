import { prisma } from "./prisma";

/**
 * Computes a Bayesian smoothed ranking score for a provider.
 *
 * Formula: (averageRating * reviewCount + 4.0 * 5) / (reviewCount + 5)
 *
 * When reviewCount === 0:
 * (0 * 0 + 4.0 * 5) / (0 + 5) = 20 / 5 = 4.0
 *
 * This assigns unreviewed / new providers a neutral score of 4.0 so they are not
 * buried beneath lower-rated providers.
 */
export function computeRankScore(averageRating: number, reviewCount: number): number {
  const safeRating = Number.isFinite(averageRating) ? averageRating : 0;
  const safeCount = Number.isFinite(reviewCount) && reviewCount > 0 ? reviewCount : 0;
  return (safeRating * safeCount + 4.0 * 5) / (safeCount + 5);
}

/**
 * Helper to recalculate and update the rankScore for all providers in the database.
 */
export async function recomputeAllProviderRankScores(
  client: typeof prisma = prisma
): Promise<{ updatedCount: number }> {
  const providers = await client.provider.findMany({
    select: {
      id: true,
      averageRating: true,
      reviewCount: true,
    },
  });

  let updatedCount = 0;
  for (const p of providers) {
    const score = computeRankScore(p.averageRating, p.reviewCount);
    await client.provider.update({
      where: { id: p.id },
      data: { rankScore: score },
    });
    updatedCount++;
  }

  return { updatedCount };
}

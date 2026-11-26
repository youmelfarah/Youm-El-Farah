import type { Prisma } from "@prisma/client";
import { computeRankScore } from "@/lib/ranking";

export {
  REVIEW_MAX_COMMENT_LENGTH,
  REVIEW_MAX_REPLY_LENGTH,
  REVIEW_REPORT_MAX_REASON_LENGTH,
  REVIEW_MODERATION_NOTE_MAX_LENGTH,
  REVIEW_STATUS_LABELS_AR,
  reviewInputSchema,
  reviewReplySchema,
  reviewReportSchema,
} from "@/lib/review-validation";

/**
 * Recomputes averageRating, reviewCount, and rankScore for a provider
 * from its APPROVED reviews inside the given Prisma transaction.
 */
export async function recomputeProviderRatingAggregates(
  tx: Prisma.TransactionClient,
  providerId: string
): Promise<{ averageRating: number; reviewCount: number; rankScore: number }> {
  const agg = await tx.review.aggregate({
    where: {
      providerId,
      status: "APPROVED",
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const reviewCount = agg._count._all;
  const averageRating =
    reviewCount > 0 && agg._avg.rating !== null
      ? Math.round(agg._avg.rating * 100) / 100
      : 0;
  const rankScore = computeRankScore(averageRating, reviewCount);

  await tx.provider.update({
    where: { id: providerId },
    data: {
      averageRating,
      reviewCount,
      rankScore,
    },
  });

  return { averageRating, reviewCount, rankScore };
}

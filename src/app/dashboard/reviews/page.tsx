import { Info } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireProviderPage } from "@/lib/provider-dashboard";
import { formatReviewerDisplayName } from "@/lib/display-name";
import { toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { Card, CardContent } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import {
  DashboardReviewsClient,
  type DashboardReviewItem,
} from "./reviews-client";

export const dynamic = "force-dynamic";

export default async function DashboardReviewsPage() {
  const session = await requireProviderPage();
  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      averageRating: true,
      reviewCount: true,
    },
  });

  if (!provider) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-text-muted">
          يرجى إكمال بيانات ملفك التعريفي أولاً لعرض التقييمات.
        </CardContent>
      </Card>
    );
  }

  const approvedReviews = await prisma.review.findMany({
    where: {
      providerId: provider.id,
      status: "APPROVED",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      providerReply: true,
      providerRepliedAt: true,
      providerReplyHidden: true,
      user: { select: { name: true } },
    },
  });

  const items: DashboardReviewItem[] = approvedReviews.map((r) => ({
    id: r.id,
    authorDisplayName: formatReviewerDisplayName(r.user.name),
    rating: r.rating,
    comment: r.comment,
    createdAtLabel: formatArabicDateString(toCairoDateString(r.createdAt)),
    providerReply: r.providerReply,
    providerRepliedAtLabel: r.providerRepliedAt
      ? formatArabicDateString(toCairoDateString(r.providerRepliedAt))
      : null,
    providerReplyHidden: r.providerReplyHidden,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">
            تقييمات العملاء
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            استعرضي التقييمات المعتمدة وردي عليها مباشرة.
          </p>
        </div>
        {provider.reviewCount > 0 && (
          <div className="rounded-[4px] border border-border bg-surface-raised px-4 py-2.5">
            <Rating
              value={provider.averageRating}
              count={provider.reviewCount}
              size="md"
            />
          </div>
        )}
      </div>

      <div
        role="note"
        className="flex items-start gap-2.5 rounded-[4px] border border-border bg-surface-raised p-4 text-xs text-text-muted"
      >
        <Info className="h-4 w-4 shrink-0 text-accent-text mt-0.5" weight="light" />
        <p>
          التقييمات التي ما زالت قيد المراجعة أو المرفوضة من الإدارة لا تظهر هنا. يمكنك كتابة رد واحد لكل تقييم معتمد أو تعديله أو حذفه، ويظهر الرد فوراً على ملفك العام.
        </p>
      </div>

      <DashboardReviewsClient reviews={items} />
    </div>
  );
}

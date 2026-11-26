import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { checkProviderVisibility } from "@/lib/provider-visibility";
import { toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import {
  VisitorReviewsClient,
  type VisitorReviewItem,
} from "./reviews-client";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const session = await requireUser();
  const role = (session.user as { role?: string }).role;
  if (role !== "VISITOR") {
    redirect(role === "ADMIN" ? "/admin" : "/dashboard");
  }

  const rawReviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      providerId: true,
      rating: true,
      comment: true,
      status: true,
      moderationNote: true,
      providerReply: true,
      providerReplyHidden: true,
      createdAt: true,
      provider: {
        select: {
          name: true,
          slug: true,
          status: true,
          subscriptions: {
            where: { status: "ACTIVE" },
            select: { status: true, startsAt: true, endsAt: true },
          },
        },
      },
    },
  });

  const reviews: VisitorReviewItem[] = rawReviews.map((r) => ({
    id: r.id,
    providerId: r.providerId,
    providerName: r.provider.name,
    providerSlug: r.provider.slug,
    providerVisible: checkProviderVisibility(r.provider).isVisible,
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    moderationNote: r.status === "REJECTED" ? r.moderationNote : null,
    providerReply:
      r.providerReply && !r.providerReplyHidden ? r.providerReply : null,
    createdAtLabel: formatArabicDateString(toCairoDateString(r.createdAt)),
  }));

  return (
    <div className="min-h-screen bg-surface text-text">
      <PublicHeader />
      <Section spacing="sm">
        <Container className="max-w-3xl space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="MY REVIEWS"
              title="تقييماتي"
              description="تابعي حالة تقييماتك لمقدمي الخدمات ويمكنك تعديلها أو حذفها في أي وقت."
            />
            <Button asChild variant="secondary" size="sm">
              <Link href="/account">العودة لحسابي</Link>
            </Button>
          </div>

          <VisitorReviewsClient reviews={reviews} />
        </Container>
      </Section>
    </div>
  );
}

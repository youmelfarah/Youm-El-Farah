import { notFound, redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { DISTRICT_LABELS } from "@/lib/districts";
import {
  daysUntil,
  getLastCoveredDateString,
  toCairoDateString,
} from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { getSubscriptionState } from "@/lib/subscription";
import { ProviderDetailClient } from "./provider-detail-client";

export const dynamic = "force-dynamic";

export default async function ProviderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      redirect("/unauthorized");
    }
    redirect("/login");
  }

  const { id } = await props.params;

  const [provider, offersCount, imagesCount, videosCount, blockedDatesCount, auditLogs] =
    await Promise.all([
      prisma.provider.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isActive: true,
              mustChangePassword: true,
            },
          },
          categories: {
            include: { category: true },
          },
          subscriptions: {
            orderBy: { endsAt: "desc" },
            include: {
              createdBy: { select: { name: true } },
            },
          },
        },
      }),
      prisma.offer.count({ where: { providerId: id } }),
      prisma.media.count({ where: { providerId: id, type: "IMAGE" } }),
      prisma.media.count({ where: { providerId: id, type: "VIDEO" } }),
      prisma.blockedDate.count({ where: { providerId: id } }),
      prisma.auditLog.findMany({
        where: { providerId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          admin: { select: { name: true } },
        },
      }),
    ]);

  if (!provider) {
    notFound();
  }

  const now = new Date();
  const subState = getSubscriptionState(provider.subscriptions, now);

  // Active subscription covering now or next ending
  const activeSub = provider.subscriptions.find(
    (s) => s.status === "ACTIVE" && s.startsAt <= now && s.endsAt > now
  );
  const futureOrActiveSub = provider.subscriptions
    .filter((s) => s.status === "ACTIVE" && s.endsAt > now)
    .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime())[0];

  const relevantSub = activeSub || futureOrActiveSub || provider.subscriptions[0];
  const lastCoveredDayStr = relevantSub
    ? getLastCoveredDateString(relevantSub.endsAt)
    : null;

  // Suggested start date for new/renewal subscription
  const suggestedStartDate = futureOrActiveSub
    ? toCairoDateString(futureOrActiveSub.endsAt)
    : toCairoDateString(now);

  const daysRemaining = activeSub ? daysUntil(activeSub.endsAt, now) : null;

  return (
    <ProviderDetailClient
      provider={{
        id: provider.id,
        slug: provider.slug,
        name: provider.name,
        bio: provider.bio,
        districtLabel: DISTRICT_LABELS[provider.district] || provider.district,
        address: provider.address,
        phone: provider.phone,
        whatsapp: provider.whatsapp,
        instagramUrl: provider.instagramUrl,
        facebookUrl: provider.facebookUrl,
        logoUrl: provider.logoUrl,
        coverUrl: provider.coverUrl,
        status: provider.status,
        maxOffers: provider.maxOffers,
        maxImages: provider.maxImages,
        maxVideos: provider.maxVideos,
        adminNotes: provider.adminNotes,
        averageRating: provider.averageRating,
        reviewCount: provider.reviewCount,
        createdAtFormatted: formatArabicDateString(toCairoDateString(provider.createdAt)),
        categories: provider.categories.map((c) => ({
          id: c.categoryId,
          nameAr: c.category.nameAr,
          isPrimary: c.isPrimary,
        })),
        counts: {
          offers: offersCount,
          images: imagesCount,
          videos: videosCount,
          blockedDates: blockedDatesCount,
        },
        user: provider.user,
        subscriptionSummary: {
          state: subState,
          startsAtDateStr: relevantSub ? toCairoDateString(relevantSub.startsAt) : null,
          lastCoveredDayDateStr: lastCoveredDayStr,
          lastCoveredDayFormatted: lastCoveredDayStr
            ? formatArabicDateString(lastCoveredDayStr)
            : null,
          daysRemaining,
          activeSubscriptionId: activeSub?.id ?? null,
          suggestedStartDate,
        },
        subscriptionsHistory: provider.subscriptions.map((s) => ({
          id: s.id,
          status: s.status,
          startsAtFormatted: formatArabicDateString(toCairoDateString(s.startsAt)),
          lastCoveredDayFormatted: formatArabicDateString(
            getLastCoveredDateString(s.endsAt)
          ),
          amountPaid: s.amountPaid,
          paymentMethod: s.paymentMethod,
          paymentNote: s.paymentNote,
          planName: s.planName,
          createdByName: s.createdBy?.name || "الإدارة",
          createdAtFormatted: formatArabicDateString(toCairoDateString(s.createdAt)),
        })),
        recentActivity: auditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          adminName: log.admin.name,
          createdAtFormatted: formatArabicDateString(toCairoDateString(log.createdAt)),
          details: log.details,
        })),
      }}
    />
  );
}

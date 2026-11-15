import { Prisma, ProviderStatus } from "@prisma/client";

/**
 * Returns a Prisma WHERE clause that selects only publicly visible providers.
 *
 * A provider is visible when:
 * - status = APPROVED
 * - has at least one Subscription with status ACTIVE, startsAt <= now, endsAt > now
 *
 * This is the single source of truth for visibility — every public query must use it.
 */
export function visibleProviderWhere(): Prisma.ProviderWhereInput {
  const now = new Date();

  return {
    status: "APPROVED",
    subscriptions: {
      some: {
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
    },
  };
}

export interface ProviderVisibilityInfo {
  isVisible: boolean;
  reason?: string;
}

export function checkProviderVisibility(provider: {
  status: ProviderStatus;
  subscriptions?: Array<{
    status: string;
    startsAt: Date;
    endsAt: Date;
  }>;
}): ProviderVisibilityInfo {
  const now = new Date();
  const hasActiveSub = Boolean(
    provider.subscriptions?.some(
      (s) => s.status === "ACTIVE" && s.startsAt <= now && s.endsAt > now
    )
  );

  if (provider.status === "PENDING") {
    return {
      isVisible: false,
      reason: "الملف قيد المراجعة والاعتماد من قِبل إدارة المنصة.",
    };
  }

  if (provider.status === "SUSPENDED") {
    return {
      isVisible: false,
      reason: "تم تعليق هذا الملف مؤقتاً لمخالفة معايير الجودة أو شروط الاستخدام.",
    };
  }

  if (!hasActiveSub) {
    return {
      isVisible: false,
      reason: "لا يوجد اشتراك نشط وساري المفعول لهذا الملف حالياً.",
    };
  }

  return { isVisible: true };
}



import type { PaymentMethod, Subscription, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  addMonthsCairo,
  cairoStartOfDay,
  daysUntil,
  getLastCoveredDateString,
  toCairoDateString,
} from "./cairo-time";

export type SubscriptionState =
  | "NONE"
  | "ACTIVE"
  | "EXPIRING"
  | "EXPIRED"
  | "FUTURE"
  | "CANCELLED";

export interface SubscriptionItem {
  id: string;
  status: SubscriptionStatus;
  startsAt: Date;
  endsAt: Date;
  createdAt?: Date;
}

/**
 * Returns the derived subscription state for a provider's subscriptions:
 * - NONE: never subscribed
 * - ACTIVE: has an active subscription covering now, with > 30 days left
 * - EXPIRING: has an active subscription covering now, with <= 30 days left
 * - FUTURE: no subscription covering now, but has a future active subscription
 * - CANCELLED: latest subscription was cancelled and nothing else covers now
 * - EXPIRED: had subscriptions, none active or future
 *
 * Derived purely from dates and status — does not rely on a cron job or write on page load.
 */
export function getSubscriptionState(
  subscriptions: SubscriptionItem[],
  now: Date = new Date()
): SubscriptionState {
  if (!subscriptions || subscriptions.length === 0) {
    return "NONE";
  }

  // 1. Check for any ACTIVE subscription covering the current moment: startsAt <= now < endsAt
  const activeSubs = subscriptions.filter(
    (s) => s.status === "ACTIVE" && s.startsAt <= now && s.endsAt > now
  );

  if (activeSubs.length > 0) {
    // Pick the one with the latest endsAt
    const latestActive = activeSubs.reduce((prev, curr) =>
      curr.endsAt > prev.endsAt ? curr : prev
    );

    const remainingDays = daysUntil(latestActive.endsAt, now);
    if (remainingDays <= 30) {
      return "EXPIRING";
    }
    return "ACTIVE";
  }

  // 2. Check for any future ACTIVE subscriptions: startsAt > now
  const futureSubs = subscriptions.filter(
    (s) => s.status === "ACTIVE" && s.startsAt > now
  );
  if (futureSubs.length > 0) {
    return "FUTURE";
  }

  // 3. No active subscription covers now and none in the future.
  // Look at the latest subscription by endsAt descending (or startsAt)
  const sorted = [...subscriptions].sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime());
  const latest = sorted[0];

  if (latest && latest.status === "CANCELLED") {
    return "CANCELLED";
  }

  return "EXPIRED";
}

/**
 * Finds an existing non-cancelled subscription whose [startsAt, endsAt) window overlaps
 * the candidate [candidateStart, candidateEnd) window.
 */
export function findOverlappingSubscription<
  T extends Pick<SubscriptionItem, "status" | "startsAt" | "endsAt">,
>(
  subscriptions: T[],
  candidateStart: Date,
  candidateEnd: Date
): T | undefined {
  return subscriptions.find((s) => {
    if (s.status === "CANCELLED") return false;
    return candidateStart < s.endsAt && s.startsAt < candidateEnd;
  });
}

export interface CreateSubscriptionParams {
  providerId: string;
  adminId: string;
  startDate?: string; // "YYYY-MM-DD"
  months?: number; // 6 or 12
  endDate?: string; // "YYYY-MM-DD" (exclusive end date)
  amountPaid: number; // 0 to 10,000,000
  paymentMethod: PaymentMethod;
  paymentNote?: string | null;
  planName?: string | null;
}

/**
 * Creates a subscription inside a transaction and writes an AuditLog entry.
 * Enforces the renewal rule and rejects any overlapping subscriptions.
 */
export async function createSubscription(params: CreateSubscriptionParams) {
  const {
    providerId,
    adminId,
    startDate,
    months,
    endDate,
    amountPaid,
    paymentMethod,
    paymentNote,
    planName,
  } = params;

  if (amountPaid < 0 || amountPaid > 10_000_000 || !Number.isInteger(amountPaid)) {
    throw new Error("المبلغ المدفوع يجب أن يكون عدداً صحيحاً بين 0 و 10,000,000 جنيه");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Verify provider exists
    const provider = await tx.provider.findUnique({
      where: { id: providerId },
      include: {
        subscriptions: true,
      },
    });

    if (!provider) {
      throw new Error("مقدم الخدمة غير موجود");
    }

    const now = new Date();

    // 2. Determine startsAt
    let startsAt: Date;
    if (startDate) {
      startsAt = cairoStartOfDay(startDate);
    } else {
      // Renewal rule:
      // If current subscription is active or future, start when current ends.
      // If expired or none exists, starts today.
      const activeOrFuture = provider.subscriptions
        .filter((s) => s.status === "ACTIVE" && s.endsAt > now)
        .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime());

      if (activeOrFuture.length > 0) {
        startsAt = activeOrFuture[0].endsAt;
      } else {
        startsAt = cairoStartOfDay(toCairoDateString(now));
      }
    }

    // 3. Determine endsAt
    let endsAt: Date;
    if (months && months > 0) {
      const startCairoStr = toCairoDateString(startsAt);
      const endCairoStr = addMonthsCairo(startCairoStr, months);
      endsAt = cairoStartOfDay(endCairoStr);
    } else if (endDate) {
      endsAt = cairoStartOfDay(endDate);
    } else {
      throw new Error("يجب تحديد مدة الاشتراك بالأشهر أو تحديد تاريخ انتهاء مخصص");
    }

    if (endsAt <= startsAt) {
      throw new Error("تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء بيوم واحد على الأقل");
    }

    // 4. Overlap check against existing non-cancelled subscriptions
    const overlapping = findOverlappingSubscription(
      provider.subscriptions,
      startsAt,
      endsAt
    );

    if (overlapping) {
      const conflictStart = toCairoDateString(overlapping.startsAt);
      const conflictEnd = getLastCoveredDateString(overlapping.endsAt);
      throw new Error(
        `يوجد تعارض في التواريخ مع اشتراك آخر لهذا المقدم (من ${conflictStart} حتى ${conflictEnd})`
      );
    }

    // 5. Create Subscription
    const subscription = await tx.subscription.create({
      data: {
        providerId,
        status: "ACTIVE",
        startsAt,
        endsAt,
        amountPaid,
        paymentMethod,
        paymentNote: paymentNote || null,
        planName: planName || null,
        createdById: adminId,
      },
    });

    // 6. Write AuditLog entry
    await tx.auditLog.create({
      data: {
        adminId,
        action: "subscription.create",
        entityType: "Subscription",
        entityId: subscription.id,
        providerId,
        details: {
          subscriptionId: subscription.id,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          lastCoveredDay: getLastCoveredDateString(endsAt),
          amountPaid,
          paymentMethod,
          paymentNote: paymentNote || null,
          planName: planName || null,
        },
      },
    });

    return subscription;
  });
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  adminId: string;
  reason?: string | null;
}

/**
 * Cancels a subscription inside a transaction and writes an AuditLog entry.
 * Keeps the row for history while immediately ending visibility.
 */
export async function cancelSubscription(params: CancelSubscriptionParams) {
  const { subscriptionId, adminId, reason } = params;

  return prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!sub) {
      throw new Error("الاشتراك غير موجود");
    }

    if (sub.status === "CANCELLED") {
      throw new Error("الاشتراك ملغي بالفعل");
    }

    const updated = await tx.subscription.update({
      where: { id: subscriptionId },
      data: { status: "CANCELLED" },
    });

    await tx.auditLog.create({
      data: {
        adminId,
        action: "subscription.cancel",
        entityType: "Subscription",
        entityId: sub.id,
        providerId: sub.providerId,
        details: {
          subscriptionId: sub.id,
          before: { status: sub.status },
          after: { status: "CANCELLED" },
          reason: reason || null,
        },
      },
    });

    return updated;
  });
}

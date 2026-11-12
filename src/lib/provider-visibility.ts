import { Prisma } from "@prisma/client";

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


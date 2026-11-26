import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import {
  findOverlappingSubscription,
  getSubscriptionState,
  type SubscriptionItem,
} from "@/lib/subscription";

const d = (iso: string) => new Date(iso);

describe("getSubscriptionState", () => {
  const now = d("2026-06-15T12:00:00Z");

  it("returns NONE when empty", () => {
    expect(getSubscriptionState([], now)).toBe("NONE");
  });

  it("returns ACTIVE when active subscription has > 30 days left", () => {
    const subs: SubscriptionItem[] = [
      {
        id: "s1",
        status: "ACTIVE",
        startsAt: d("2026-06-01T00:00:00Z"),
        endsAt: d("2026-08-01T00:00:00Z"),
      },
    ];
    expect(getSubscriptionState(subs, now)).toBe("ACTIVE");
  });

  it("returns EXPIRING when active subscription has <= 30 days left", () => {
    const subs: SubscriptionItem[] = [
      {
        id: "s1",
        status: "ACTIVE",
        startsAt: d("2026-05-01T00:00:00Z"),
        endsAt: d("2026-07-01T00:00:00Z"),
      },
    ];
    expect(getSubscriptionState(subs, now)).toBe("EXPIRING");
  });

  it("returns FUTURE when only a future active subscription exists", () => {
    const subs: SubscriptionItem[] = [
      {
        id: "s1",
        status: "ACTIVE",
        startsAt: d("2026-07-01T00:00:00Z"),
        endsAt: d("2026-10-01T00:00:00Z"),
      },
    ];
    expect(getSubscriptionState(subs, now)).toBe("FUTURE");
  });

  it("returns CANCELLED when latest subscription was cancelled", () => {
    const subs: SubscriptionItem[] = [
      {
        id: "s1",
        status: "CANCELLED",
        startsAt: d("2026-06-01T00:00:00Z"),
        endsAt: d("2026-09-01T00:00:00Z"),
      },
    ];
    expect(getSubscriptionState(subs, now)).toBe("CANCELLED");
  });

  it("returns EXPIRED when past active subscriptions ended", () => {
    const subs: SubscriptionItem[] = [
      {
        id: "s1",
        status: "ACTIVE",
        startsAt: d("2026-01-01T00:00:00Z"),
        endsAt: d("2026-06-01T00:00:00Z"),
      },
    ];
    expect(getSubscriptionState(subs, now)).toBe("EXPIRED");
  });
});

describe("findOverlappingSubscription", () => {
  const existing: SubscriptionItem[] = [
    {
      id: "active-1",
      status: "ACTIVE",
      startsAt: d("2026-06-01T00:00:00Z"),
      endsAt: d("2026-09-01T00:00:00Z"),
    },
    {
      id: "cancelled-1",
      status: "CANCELLED",
      startsAt: d("2026-09-01T00:00:00Z"),
      endsAt: d("2026-12-01T00:00:00Z"),
    },
  ];

  it("allows adjacent back-to-back window starting exactly at existing endsAt", () => {
    const conflict = findOverlappingSubscription(
      existing,
      d("2026-09-01T00:00:00Z"),
      d("2026-12-01T00:00:00Z")
    );
    expect(conflict).toBeUndefined();
  });

  it("ignores CANCELLED subscriptions", () => {
    const conflict = findOverlappingSubscription(
      existing,
      d("2026-09-15T00:00:00Z"),
      d("2026-11-01T00:00:00Z")
    );
    expect(conflict).toBeUndefined();
  });

  it("detects partial overlap with ACTIVE subscription", () => {
    const conflict = findOverlappingSubscription(
      existing,
      d("2026-08-15T00:00:00Z"),
      d("2026-10-01T00:00:00Z")
    );
    expect(conflict?.id).toBe("active-1");
  });
});

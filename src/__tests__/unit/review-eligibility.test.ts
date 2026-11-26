import { describe, expect, it } from "vitest";
import {
  checkReviewEligibility,
  isPhoneVerificationRequired,
  MAX_REVIEWS_PER_24H,
} from "@/lib/review-eligibility";

describe("checkReviewEligibility", () => {
  const base = {
    userId: "user-1",
    userRole: "VISITOR",
    providerUserId: "provider-owner",
    hasExistingReview: false,
    isEdit: false,
    recentReviewsCount24h: 0,
    phoneVerified: true,
    phoneVerificationRequired: false,
  };

  it("allows eligible visitor to submit a review", () => {
    expect(checkReviewEligibility(base)).toEqual({ eligible: true });
  });

  it("blocks signed-out users", () => {
    const res = checkReviewEligibility({ ...base, userId: null });
    expect(res.eligible).toBe(false);
    expect(res.code).toBe("UNAUTHENTICATED");
  });

  it("blocks ADMIN and PROVIDER roles", () => {
    expect(checkReviewEligibility({ ...base, userRole: "ADMIN" }).code).toBe(
      "FORBIDDEN_ROLE"
    );
    expect(checkReviewEligibility({ ...base, userRole: "PROVIDER" }).code).toBe(
      "FORBIDDEN_ROLE"
    );
  });

  it("blocks reviewing own provider account", () => {
    const res = checkReviewEligibility({
      ...base,
      providerUserId: "user-1",
    });
    expect(res.eligible).toBe(false);
    expect(res.code).toBe("OWN_PROVIDER");
  });

  it("enforces one review per provider and supports edit mode", () => {
    expect(
      checkReviewEligibility({ ...base, hasExistingReview: true }).code
    ).toBe("ALREADY_REVIEWED");

    expect(
      checkReviewEligibility({
        ...base,
        hasExistingReview: true,
        isEdit: true,
      }).eligible
    ).toBe(true);
  });

  it("enforces 5 reviews per 24 hours limit", () => {
    const res = checkReviewEligibility({
      ...base,
      recentReviewsCount24h: MAX_REVIEWS_PER_24H,
    });
    expect(res.eligible).toBe(false);
    expect(res.code).toBe("RATE_LIMITED");
  });

  it("enforces phone verification only when flag is true", () => {
    expect(isPhoneVerificationRequired("false")).toBe(false);
    expect(isPhoneVerificationRequired("true")).toBe(true);

    expect(
      checkReviewEligibility({
        ...base,
        phoneVerified: false,
        phoneVerificationRequired: false,
      }).eligible
    ).toBe(true);

    expect(
      checkReviewEligibility({
        ...base,
        phoneVerified: false,
        phoneVerificationRequired: true,
      }).code
    ).toBe("PHONE_REQUIRED");
  });
});

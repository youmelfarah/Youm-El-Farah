export type ReviewEligibilityErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN_ROLE"
  | "OWN_PROVIDER"
  | "ALREADY_REVIEWED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "PHONE_REQUIRED";

export interface ReviewEligibilityInput {
  userId?: string | null;
  userRole?: string | null;
  providerUserId?: string | null;
  hasExistingReview: boolean;
  isEdit?: boolean;
  recentReviewsCount24h?: number;
  phoneVerified?: boolean;
  phoneVerificationRequired?: boolean;
}

export interface ReviewEligibilityResult {
  eligible: boolean;
  code?: ReviewEligibilityErrorCode;
  reason?: string;
}

export const MAX_REVIEWS_PER_24H = 5;

export function isPhoneVerificationRequired(
  envValue: string | undefined = process.env.PHONE_VERIFICATION_REQUIRED
): boolean {
  return envValue === "true";
}

/**
 * Pure eligibility check for submitting or editing a review.
 * Only VISITOR accounts can review, never providers/admins or the provider's owner.
 */
export function checkReviewEligibility(
  input: ReviewEligibilityInput
): ReviewEligibilityResult {
  if (!input.userId) {
    return {
      eligible: false,
      code: "UNAUTHENTICATED",
      reason: "سجّلي دخولك بجوجل علشان تكملي",
    };
  }

  if (input.userRole !== "VISITOR") {
    return {
      eligible: false,
      code: "FORBIDDEN_ROLE",
      reason: "التقييمات متاحة لحسابات الزائرات فقط",
    };
  }

  if (input.providerUserId && input.providerUserId === input.userId) {
    return {
      eligible: false,
      code: "OWN_PROVIDER",
      reason: "لا يمكنك تقييم حسابك كمقدم خدمة",
    };
  }

  const isEdit = Boolean(input.isEdit);
  if (!isEdit && input.hasExistingReview) {
    return {
      eligible: false,
      code: "ALREADY_REVIEWED",
      reason: "لقد قمتِ بتقييم مقدم الخدمة هذا مسبقاً. يمكنك تعديل تقييمك أو حذفه.",
    };
  }

  if (isEdit && !input.hasExistingReview) {
    return {
      eligible: false,
      code: "NOT_FOUND",
      reason: "التقييم غير موجود",
    };
  }

  if ((input.recentReviewsCount24h ?? 0) >= MAX_REVIEWS_PER_24H) {
    return {
      eligible: false,
      code: "RATE_LIMITED",
      reason: `وصلتِ للحد الأقصى للتقييمات (${MAX_REVIEWS_PER_24H} تقييمات خلال 24 ساعة)`,
    };
  }

  if (!isEdit && input.phoneVerificationRequired && !input.phoneVerified) {
    return {
      eligible: false,
      code: "PHONE_REQUIRED",
      reason: "يرجى تأكيد رقم هاتفك قبل إرسال أول تقييم",
    };
  }

  return { eligible: true };
}

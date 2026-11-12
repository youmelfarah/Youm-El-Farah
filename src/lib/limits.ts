export const DEFAULT_LIMITS = {
  offers: 5,
  images: 10,
  videos: 2,
} as const;

export const ABSOLUTE_MAX = {
  offers: 10,
  images: 20,
  videos: 5,
} as const;

export interface ProviderLimitsInput {
  maxOffers?: number | null;
  maxImages?: number | null;
  maxVideos?: number | null;
}

export interface ProviderLimits {
  offers: number;
  images: number;
  videos: number;
}

function clampLimit(
  override: number | null | undefined,
  defaultValue: number,
  absoluteMax: number
): number {
  const effective = override ?? defaultValue;
  return Math.max(0, Math.min(effective, absoluteMax));
}

/**
 * Returns the effective per-provider limits:
 * provider override if set, otherwise DEFAULT_LIMITS, never exceeding ABSOLUTE_MAX.
 */
export function getProviderLimits(
  provider: ProviderLimitsInput
): ProviderLimits {
  return {
    offers: clampLimit(
      provider.maxOffers,
      DEFAULT_LIMITS.offers,
      ABSOLUTE_MAX.offers
    ),
    images: clampLimit(
      provider.maxImages,
      DEFAULT_LIMITS.images,
      ABSOLUTE_MAX.images
    ),
    videos: clampLimit(
      provider.maxVideos,
      DEFAULT_LIMITS.videos,
      ABSOLUTE_MAX.videos
    ),
  };
}


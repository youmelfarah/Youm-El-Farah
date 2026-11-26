export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Documented platform rate limits:
 * - Reviews: 5 submissions/edits per user per 24 hours (DB-backed)
 * - Review reports: 10 reports per user per 24 hours (DB-backed)
 * - Favorites toggles: 200 toggles per user per 24 hours (in-memory sliding window)
 * - Leads total: 5 leads per user per 24 hours (DB-backed)
 * - Leads per provider: 1 lead per user per provider per 24 hours (DB-backed)
 */
export const RATE_LIMITS = {
  REVIEW_SUBMISSION_24H: { max: 5, windowMs: ONE_DAY_MS },
  REVIEW_REPORT_24H: { max: 10, windowMs: ONE_DAY_MS },
  FAVORITE_TOGGLE_24H: { max: 200, windowMs: ONE_DAY_MS },
  LEAD_SUBMISSION_24H: { max: 5, windowMs: ONE_DAY_MS },
  LEAD_PER_PROVIDER_24H: { max: 1, windowMs: ONE_DAY_MS },
} as const;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Pure sliding-window in-memory rate limiter suitable for soft per-user limits
 * and deterministic unit testing via injectable clock.
 */
export class InMemoryRateLimiter {
  private readonly timestamps = new Map<string, number[]>();
  private readonly nowFn: () => number;

  constructor(nowFn: () => number = () => Date.now()) {
    this.nowFn = nowFn;
  }

  check(key: string, max: number, windowMs: number): RateLimitResult {
    const now = this.nowFn();
    const cutoff = now - windowMs;
    const existing = (this.timestamps.get(key) ?? []).filter((ts) => ts > cutoff);

    if (existing.length >= max) {
      const oldest = existing[0] ?? now;
      this.timestamps.set(key, existing);
      return {
        allowed: false,
        remaining: 0,
        resetAt: oldest + windowMs,
      };
    }

    existing.push(now);
    this.timestamps.set(key, existing);

    const oldest = existing[0] ?? now;
    return {
      allowed: true,
      remaining: Math.max(0, max - existing.length),
      resetAt: oldest + windowMs,
    };
  }

  prune(windowMs: number): void {
    const cutoff = this.nowFn() - windowMs;
    for (const [key, list] of this.timestamps.entries()) {
      const active = list.filter((ts) => ts > cutoff);
      if (active.length === 0) {
        this.timestamps.delete(key);
      } else {
        this.timestamps.set(key, active);
      }
    }
  }

  clear(key?: string): void {
    if (key) {
      this.timestamps.delete(key);
    } else {
      this.timestamps.clear();
    }
  }
}

export const favoriteToggleLimiter = new InMemoryRateLimiter();

export function sinceWindowDate(
  windowMs: number = ONE_DAY_MS,
  now: Date = new Date()
): Date {
  return new Date(now.getTime() - windowMs);
}

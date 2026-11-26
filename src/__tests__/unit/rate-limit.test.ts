import { describe, expect, it } from "vitest";
import { InMemoryRateLimiter } from "@/lib/rate-limit";

describe("InMemoryRateLimiter", () => {
  it("allows up to max requests within the window and blocks excess", () => {
    let now = 1_000_000;
    const limiter = new InMemoryRateLimiter(() => now);

    expect(limiter.check("u1", 3, 60_000)).toMatchObject({
      allowed: true,
      remaining: 2,
    });
    expect(limiter.check("u1", 3, 60_000)).toMatchObject({
      allowed: true,
      remaining: 1,
    });
    expect(limiter.check("u1", 3, 60_000)).toMatchObject({
      allowed: true,
      remaining: 0,
    });

    const blocked = limiter.check("u1", 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("resets slots after the sliding window expires", () => {
    let now = 1_000_000;
    const limiter = new InMemoryRateLimiter(() => now);

    limiter.check("u1", 2, 10_000);
    now += 4_000;
    limiter.check("u1", 2, 10_000);
    expect(limiter.check("u1", 2, 10_000).allowed).toBe(false);

    // Advance past first timestamp's 10s expiry
    now += 6_001;
    expect(limiter.check("u1", 2, 10_000).allowed).toBe(true);
  });

  it("isolates keys independently", () => {
    const limiter = new InMemoryRateLimiter(() => 5_000);
    expect(limiter.check("u1", 1, 60_000).allowed).toBe(true);
    expect(limiter.check("u1", 1, 60_000).allowed).toBe(false);
    expect(limiter.check("u2", 1, 60_000).allowed).toBe(true);
  });
});

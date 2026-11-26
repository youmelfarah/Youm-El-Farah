import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { computeRankScore } from "@/lib/ranking";

describe("computeRankScore", () => {
  it("returns 4.0 neutral baseline when reviewCount is 0", () => {
    expect(computeRankScore(0, 0)).toBe(4);
    expect(computeRankScore(5, 0)).toBe(4);
  });

  it("handles non-finite or negative inputs safely", () => {
    expect(computeRankScore(Number.NaN, 10)).toBeCloseTo((0 + 20) / 15, 5);
    expect(computeRankScore(4.5, -3)).toBe(4);
  });

  it("computes Bayesian smoothed score as reviewCount grows", () => {
    expect(computeRankScore(5, 5)).toBeCloseTo((25 + 20) / 10, 5);
    expect(computeRankScore(5, 50)).toBeCloseTo((250 + 20) / 55, 5);
    expect(computeRankScore(2, 20)).toBeCloseTo((40 + 20) / 25, 5);
  });
});

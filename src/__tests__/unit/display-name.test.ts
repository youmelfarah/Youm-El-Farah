import { describe, expect, it } from "vitest";
import { formatReviewerDisplayName } from "@/lib/display-name";

describe("formatReviewerDisplayName", () => {
  it("formats first name and last initial with period", () => {
    expect(formatReviewerDisplayName("نورا محمد")).toBe("نورا م.");
    expect(formatReviewerDisplayName("سارة أحمد علي")).toBe("سارة ع.");
    expect(formatReviewerDisplayName("Noura Mohamed")).toBe("Noura M.");
  });

  it("handles single-name users and extra whitespace", () => {
    expect(formatReviewerDisplayName("  مريم  ")).toBe("مريم");
    expect(formatReviewerDisplayName("   ")).toBe("زائرة");
    expect(formatReviewerDisplayName(null)).toBe("زائرة");
  });

  it("never outputs a full email address", () => {
    expect(formatReviewerDisplayName("noura@example.com")).toBe("noura");
  });
});

import { describe, expect, it } from "vitest";
import { createLeadSchema, updateLeadStatusSchema } from "@/lib/lead-validation";

describe("lead validation", () => {
  const schema = createLeadSchema("2026-06-15");

  it("accepts a valid lead and normalizes Egyptian phone", () => {
    const parsed = schema.safeParse({
      providerId: "prov-1",
      name: "نورا محمد",
      phone: "01012345678",
      weddingDate: "2026-08-20",
      offerId: "offer-1",
      message: "هل القاعة متاحة لـ 200 فرد؟",
      website: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBe("+201012345678");
      expect(parsed.data.weddingDate).toBe("2026-08-20");
    }
  });

  it("rejects wedding dates in the past relative to Cairo today", () => {
    const res = schema.safeParse({
      providerId: "prov-1",
      name: "سلمى",
      phone: "01012345678",
      weddingDate: "2026-06-14",
      website: "",
    });
    expect(res.success).toBe(false);
  });

  it("rejects non-empty honeypot field", () => {
    const res = schema.safeParse({
      providerId: "prov-1",
      name: "سلمى",
      phone: "01012345678",
      website: "https://spam.example",
    });
    expect(res.success).toBe(false);
  });

  it("rejects messages longer than 500 characters", () => {
    const res = schema.safeParse({
      providerId: "prov-1",
      name: "سلمى",
      phone: "01012345678",
      message: "أ".repeat(501),
      website: "",
    });
    expect(res.success).toBe(false);
  });

  it("validates provider lead status updates", () => {
    expect(
      updateLeadStatusSchema.safeParse({
        leadId: "lead-1",
        status: "BOOKED",
        providerNote: "تم تأكيد المعاينة",
      }).success
    ).toBe(true);

    expect(
      updateLeadStatusSchema.safeParse({
        leadId: "lead-1",
        status: "INVALID_STATUS",
      }).success
    ).toBe(false);
  });
});

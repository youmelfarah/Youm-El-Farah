import { describe, expect, it } from "vitest";
import { normalizeEgyptianPhone } from "@/lib/validation";

describe("normalizeEgyptianPhone", () => {
  it("normalizes local 01X numbers to +201X", () => {
    expect(normalizeEgyptianPhone("01012345678")).toBe("+201012345678");
    expect(normalizeEgyptianPhone("01112345678")).toBe("+201112345678");
    expect(normalizeEgyptianPhone("01212345678")).toBe("+201212345678");
    expect(normalizeEgyptianPhone("01512345678")).toBe("+201512345678");
  });

  it("normalizes 201X, 00201X, +201X, spacing, and Arabic numerals", () => {
    expect(normalizeEgyptianPhone("+20 101-234-5678")).toBe("+201012345678");
    expect(normalizeEgyptianPhone("00201012345678")).toBe("+201012345678");
    expect(normalizeEgyptianPhone("201012345678")).toBe("+201012345678");
    expect(normalizeEgyptianPhone("٠١٠١٢٣٤٥٦٧٨")).toBe("+201012345678");
  });

  it("rejects invalid prefixes, wrong lengths, and landlines", () => {
    expect(normalizeEgyptianPhone("01312345678")).toBeNull();
    expect(normalizeEgyptianPhone("0101234567")).toBeNull();
    expect(normalizeEgyptianPhone("0223456789")).toBeNull();
    expect(normalizeEgyptianPhone("abc")).toBeNull();
    expect(normalizeEgyptianPhone("")).toBeNull();
  });
});

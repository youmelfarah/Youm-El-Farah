import { describe, expect, it } from "vitest";
import {
  facebookUrlSchema,
  instagramUrlSchema,
  isValidGoogleMapsUrl,
  mapsUrlSchema,
  normalizeVideoUrl,
} from "@/lib/url-validators";

describe("URL validators", () => {
  it("validates Google Maps URLs across allowed hosts", () => {
    expect(isValidGoogleMapsUrl("https://www.google.com/maps/place/Beni+Suef")).toBe(true);
    expect(isValidGoogleMapsUrl("https://google.com/maps?q=29.0661,31.0994")).toBe(true);
    expect(isValidGoogleMapsUrl("https://maps.app.goo.gl/abc123XYZ")).toBe(true);
    expect(isValidGoogleMapsUrl("https://goo.gl/maps/xyz789")).toBe(true);
    expect(isValidGoogleMapsUrl("https://maps.google.com/?q=29.06,31.09")).toBe(true);
  });

  it("rejects non-https or non-Maps URLs", () => {
    expect(isValidGoogleMapsUrl("http://www.google.com/maps")).toBe(false);
    expect(isValidGoogleMapsUrl("https://www.google.com/search?q=maps")).toBe(false);
    expect(isValidGoogleMapsUrl("https://goo.gl/other/123")).toBe(false);
    expect(isValidGoogleMapsUrl("https://maps.app.goo.gl/")).toBe(false);
    expect(isValidGoogleMapsUrl("https://evil.com/maps")).toBe(false);
    expect(mapsUrlSchema.parse("")).toBeNull();
  });

  it("validates Instagram and Facebook HTTPS URLs", () => {
    expect(instagramUrlSchema.parse("https://www.instagram.com/atelier_bs")).toContain(
      "instagram.com"
    );
    expect(instagramUrlSchema.safeParse("http://instagram.com/test").success).toBe(false);
    expect(instagramUrlSchema.safeParse("https://tiktok.com/@test").success).toBe(false);

    expect(facebookUrlSchema.parse("https://fb.com/myhall")).toContain("fb.com");
    expect(facebookUrlSchema.safeParse("https://evil.com/fb").success).toBe(false);
  });

  it("validates and normalizes YouTube, Facebook, and Instagram video URLs", () => {
    expect(normalizeVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });
    expect(normalizeVideoUrl("https://www.youtube.com/shorts/abcDEF12")).toEqual({
      url: "https://www.youtube.com/shorts/abcDEF12",
    });
    expect(normalizeVideoUrl("https://fb.watch/abc123")).toEqual({
      url: "https://fb.watch/abc123",
    });
    expect(normalizeVideoUrl("https://www.instagram.com/reels/Cy123abc/")).toEqual({
      url: "https://www.instagram.com/reel/Cy123abc/",
    });
    expect("error" in normalizeVideoUrl("https://vimeo.com/123456")).toBe(true);
  });
});

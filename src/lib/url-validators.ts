import { z } from "zod";
export {
  instagramUrlSchema,
  facebookUrlSchema,
  normalizeVideoUrl,
} from "@/lib/validation";

const GOOGLE_MAPS_FULL_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "google.com.eg",
  "www.google.com.eg",
]);

const GOOGLE_MAPS_DEDICATED_HOSTS = new Set([
  "maps.google.com",
  "maps.google.com.eg",
  "maps.app.goo.gl",
]);

/**
 * Validates and normalizes an HTTPS Google Maps URL.
 * Supports google.com/maps, maps.google.com, maps.app.goo.gl, and goo.gl/maps.
 */
export function normalizeGoogleMapsUrl(
  raw: string
): { url: string } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "رابط خرائط جوجل مطلوب" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: "رابط خرائط جوجل غير صالح" };
  }

  if (parsed.protocol !== "https:") {
    return { error: "يجب أن يبدأ رابط خرائط جوجل بـ https://" };
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname;

  if (GOOGLE_MAPS_DEDICATED_HOSTS.has(host)) {
    if (host === "maps.app.goo.gl" && path.replace(/\//g, "").length === 0) {
      return { error: "رابط خرائط جوجل المختصر غير مكتمل" };
    }
    return { url: parsed.toString() };
  }

  if (host === "goo.gl") {
    if (path.startsWith("/maps/") && path.length > "/maps/".length) {
      return { url: parsed.toString() };
    }
    return { error: "رابط goo.gl يجب أن يكون لخرائط جوجل (/maps/...)" };
  }

  if (GOOGLE_MAPS_FULL_HOSTS.has(host)) {
    if (path === "/maps" || path.startsWith("/maps/")) {
      return { url: parsed.toString() };
    }
    return { error: "الرابط يجب أن يشير إلى خرائط جوجل (google.com/maps)" };
  }

  return {
    error:
      "يُسمح فقط بروابط خرائط جوجل (google.com/maps أو maps.app.goo.gl أو goo.gl/maps)",
  };
}

export function isValidGoogleMapsUrl(raw: string): boolean {
  return "url" in normalizeGoogleMapsUrl(raw);
}

export const mapsUrlSchema = z
  .string()
  .trim()
  .optional()
  .default("")
  .transform((val, ctx) => {
    if (!val) return null;
    const normalized = normalizeGoogleMapsUrl(val);
    if ("error" in normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: normalized.error,
      });
      return z.NEVER;
    }
    return normalized.url;
  });

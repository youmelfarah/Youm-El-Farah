import { z } from "zod";

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

const EGYPTIAN_MOBILE_REGEX = /^\+201[0125]\d{8}$/;

function toAsciiDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => ARABIC_DIGITS[ch] ?? ch);
}

/**
 * Normalizes an Egyptian mobile number from `01XXXXXXXXX` or `+20...`
 * to `+20XXXXXXXXXX`. Returns null if the input does not match a valid Egyptian mobile.
 */
export function normalizeEgyptianPhone(raw: string): string | null {
  const cleaned = toAsciiDigits(raw).replace(/[\s\-().]/g, "");
  if (!cleaned) return null;

  let normalized = cleaned;
  if (normalized.startsWith("0020")) {
    normalized = "+20" + normalized.slice(4);
  } else if (normalized.startsWith("201") && normalized.length === 12) {
    normalized = "+" + normalized;
  } else if (normalized.startsWith("01") && normalized.length === 11) {
    normalized = "+20" + normalized.slice(1);
  }

  if (!EGYPTIAN_MOBILE_REGEX.test(normalized)) {
    return null;
  }
  return normalized;
}

export const optionalEgyptianPhoneSchema = z
  .string()
  .trim()
  .optional()
  .default("")
  .transform((val, ctx) => {
    if (!val) return null;
    const normalized = normalizeEgyptianPhone(val);
    if (!normalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "رقم الهاتف غير صحيح. أدخل رقم موبايل مصري يبدأ بـ 01 أو +20 (مثل 01012345678)",
      });
      return z.NEVER;
    }
    return normalized;
  });

function isHostMatch(hostname: string, allowedDomains: string[]): boolean {
  const lower = hostname.toLowerCase();
  return allowedDomains.some(
    (domain) => lower === domain || lower.endsWith(`.${domain}`)
  );
}

function createHttpsDomainUrlSchema(
  allowedDomains: string[],
  errorMessage: string
) {
  return z
    .string()
    .trim()
    .optional()
    .default("")
    .transform((val, ctx) => {
      if (!val) return null;
      let parsed: URL;
      try {
        parsed = new URL(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errorMessage,
        });
        return z.NEVER;
      }

      if (parsed.protocol !== "https:") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "يجب أن يبدأ الرابط بـ https://",
        });
        return z.NEVER;
      }

      if (!isHostMatch(parsed.hostname, allowedDomains)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errorMessage,
        });
        return z.NEVER;
      }

      return parsed.toString();
    });
}

export const instagramUrlSchema = createHttpsDomainUrlSchema(
  ["instagram.com"],
  "رابط إنستجرام يجب أن يكون رابط https صحيح على نطاق instagram.com"
);

export const facebookUrlSchema = createHttpsDomainUrlSchema(
  ["facebook.com", "fb.com"],
  "رابط فيسبوك يجب أن يكون رابط https صحيح على نطاق facebook.com أو fb.com"
);

const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{6,20}$/;
const INSTAGRAM_SHORTCODE_REGEX = /^[A-Za-z0-9_-]{4,40}$/;

/**
 * Validates and normalizes an external video URL from YouTube, Facebook, or Instagram (HTTPS only).
 */
export function normalizeVideoUrl(
  raw: string
): { url: string } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { error: "رابط الفيديو مطلوب" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: "رابط الفيديو غير صالح" };
  }

  if (parsed.protocol !== "https:") {
    return { error: "يجب أن يبدأ رابط الفيديو بـ https://" };
  }

  const host = parsed.hostname.toLowerCase();
  const segments = parsed.pathname.split("/").filter(Boolean);

  // YouTube short domain
  if (host === "youtu.be") {
    const videoId = segments[0];
    if (!videoId || !YOUTUBE_ID_REGEX.test(videoId)) {
      return { error: "رابط يوتيوب غير مكتمل أو غير صالح" };
    }
    return { url: `https://www.youtube.com/watch?v=${videoId}` };
  }

  // YouTube main/mobile domains
  if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
    const watchId = parsed.searchParams.get("v");
    if (parsed.pathname === "/watch" && watchId && YOUTUBE_ID_REGEX.test(watchId)) {
      return { url: `https://www.youtube.com/watch?v=${watchId}` };
    }
    if (
      segments.length >= 2 &&
      (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") &&
      YOUTUBE_ID_REGEX.test(segments[1])
    ) {
      if (segments[0] === "shorts") {
        return { url: `https://www.youtube.com/shorts/${segments[1]}` };
      }
      return { url: `https://www.youtube.com/watch?v=${segments[1]}` };
    }
    return { error: "رابط فيديو يوتيوب غير صالح" };
  }

  // Facebook watch short domain
  if (host === "fb.watch") {
    const slug = segments[0];
    if (!slug) {
      return { error: "رابط fb.watch غير مكتمل" };
    }
    return { url: `https://fb.watch/${slug}` };
  }

  // Facebook main/mobile domains
  if (
    host === "facebook.com" ||
    host === "www.facebook.com" ||
    host === "m.facebook.com" ||
    host === "web.facebook.com"
  ) {
    if (segments.length === 0) {
      return { error: "رابط فيديو فيسبوك غير مكتمل" };
    }
    const cleanUrl = new URL(`https://www.facebook.com${parsed.pathname}`);
    for (const keepParam of ["v", "story_fbid", "id"]) {
      const val = parsed.searchParams.get(keepParam);
      if (val) cleanUrl.searchParams.set(keepParam, val);
    }
    return { url: cleanUrl.toString() };
  }

  // Instagram domains
  if (host === "instagram.com" || host === "www.instagram.com" || host === "m.instagram.com") {
    if (
      segments.length >= 2 &&
      (segments[0] === "reel" ||
        segments[0] === "reels" ||
        segments[0] === "p" ||
        segments[0] === "tv") &&
      INSTAGRAM_SHORTCODE_REGEX.test(segments[1])
    ) {
      const kind = segments[0] === "reels" ? "reel" : segments[0];
      return { url: `https://www.instagram.com/${kind}/${segments[1]}/` };
    }
    return {
      error: "رابط إنستجرام يجب أن يكون رابط منشور أو ريلز صالح (مثل /reel/... أو /p/...)",
    };
  }

  return {
    error:
      "يُسمح فقط بروابط HTTPS من يوتيوب (youtube.com / youtu.be) أو فيسبوك (facebook.com / fb.watch) أو إنستجرام (instagram.com)",
  };
}

export function normalizePlainText(input: string): string {
  return input.replace(/\r\n/g, "\n").trim();
}


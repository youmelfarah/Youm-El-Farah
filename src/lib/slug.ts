import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const ARABIC_TO_LATIN: Record<string, string> = {
  ا: "a",
  أ: "a",
  إ: "i",
  آ: "a",
  ٱ: "a",
  ب: "b",
  ت: "t",
  ث: "th",
  ج: "g",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "dh",
  ر: "r",
  ز: "z",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "d",
  ط: "t",
  ظ: "z",
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "q",
  ك: "k",
  ل: "l",
  م: "m",
  ن: "n",
  ه: "h",
  ة: "a",
  و: "w",
  ؤ: "w",
  ي: "y",
  ى: "a",
  ئ: "y",
  ء: "",
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
};

const TASHKEEL_REGEX = /[\u064B-\u065F\u0670\u0640]/g;

/**
 * Transliterates Arabic/mixed business name into a clean lowercase kebab-case slug base.
 */
export function transliterateToSlugBase(name: string): string {
  const cleaned = name.replace(TASHKEEL_REGEX, "").replace(/لا/g, "la");
  let out = "";
  for (const ch of cleaned) {
    if (ARABIC_TO_LATIN[ch] !== undefined) {
      out += ARABIC_TO_LATIN[ch];
    } else {
      out += ch;
    }
  }

  const kebab = out
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 50)
    .replace(/-+$/g, "");

  return kebab || "provider";
}

/**
 * Generates a unique provider slug from the business name + random suffix.
 */
export async function generateUniqueProviderSlug(name: string): Promise<string> {
  const base = transliterateToSlugBase(name);

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = randomBytes(3).toString("hex");
    const candidate = `${base}-${suffix}`;
    const existing = await prisma.provider.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }

  return `${base}-${randomBytes(6).toString("hex")}`;
}


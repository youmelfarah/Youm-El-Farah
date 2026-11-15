import { normalizeEgyptianPhone } from "./validation";
import { formatArabicDateString, isValidDateString } from "./calendar-dates";

export interface BuildWhatsAppUrlOptions {
  whatsapp?: string | null;
  phone?: string | null;
  date?: string | null;
}

/**
 * Normalizes a phone/WhatsApp number to raw international digits (e.g. "201012345678").
 */
export function normalizeWhatsAppDigits(raw?: string | null): string | null {
  if (!raw) return null;
  const normalized = normalizeEgyptianPhone(raw);
  if (!normalized) {
    // Fallback: strip non-digits, ensure starts with 20 if Egyptian 01...
    const digitsOnly = raw.replace(/\D/g, "");
    if (digitsOnly.startsWith("201") && digitsOnly.length === 12) return digitsOnly;
    if (digitsOnly.startsWith("01") && digitsOnly.length === 11) return "2" + digitsOnly;
    if (digitsOnly.length >= 10) return digitsOnly;
    return null;
  }
  return normalized.replace(/^\+/, "");
}

/**
 * Builds a direct wa.me link with a pre-filled Arabic greeting and optional wedding date.
 * Message: "أهلاً، شفت ملفكم على موقع يوم الفرح وحابة أسأل عن خدماتكم"
 * and, when a date is selected: " في يوم {date}".
 */
export function buildWhatsAppUrl({
  whatsapp,
  phone,
  date,
}: BuildWhatsAppUrlOptions): string | null {
  const digits = normalizeWhatsAppDigits(whatsapp) || normalizeWhatsAppDigits(phone);
  if (!digits) return null;

  let message = "أهلاً، شفت ملفكم على موقع يوم الفرح وحابة أسأل عن خدماتكم";
  if (date) {
    const formatted = isValidDateString(date) ? formatArabicDateString(date) : date;
    message += ` في يوم ${formatted}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

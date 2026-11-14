export const WHATSAPP_EXPIRING_TEMPLATE =
  "مرحباً {name}، نود تذكيرك بأن اشتراكك في منصة يوم الفرح سينتهي يوم {date}. لتجديد الاشتراك ومواصلة ظهور نشاطك لعملائنا، يسعدنا تواصلك معنا.";

export const WHATSAPP_EXPIRED_TEMPLATE =
  "مرحباً {name}، نود إحاطتك بأن اشتراكك في منصة يوم الفرح قد انتهى يوم {date}. لتجديد الاشتراك وإعادة تفعيل ظهور نشاطك للزوار، يسعدنا تواصلك معنا.";

/**
 * Replaces {name} and {date} placeholders in the WhatsApp template.
 */
export function formatWhatsAppReminder(
  type: "EXPIRING" | "EXPIRED",
  name: string,
  lastCoveredDateFormatted: string
): string {
  const template =
    type === "EXPIRING"
      ? WHATSAPP_EXPIRING_TEMPLATE
      : WHATSAPP_EXPIRED_TEMPLATE;

  return template
    .replace("{name}", name.trim())
    .replace("{date}", lastCoveredDateFormatted.trim());
}

/**
 * Formats a phone or WhatsApp number to digits-only international format (e.g. 201xxxxxxxxx for Egypt).
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  // If local Egyptian format starting with 01... (11 digits: 010, 011, 012, 015)
  if (digits.startsWith("0")) {
    digits = "2" + digits;
  } else if (!digits.startsWith("20") && digits.length === 10) {
    digits = "20" + digits;
  }

  return digits;
}

/**
 * Builds the WhatsApp direct chat link.
 */
export function buildWhatsAppUrl(
  phoneOrWhatsapp: string,
  message: string
): string {
  const cleanPhone = cleanPhoneNumberForWhatsApp(phoneOrWhatsapp);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

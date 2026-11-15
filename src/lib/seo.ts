/**
 * Returns the configured base application URL.
 * Emits a console warning in production if NEXT_PUBLIC_APP_URL is not set.
 */
export function getBaseAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️ Warning: NEXT_PUBLIC_APP_URL is missing in environment variables. Falling back to default production URL."
      );
    }
    return "https://youm-el-farah.com";
  }
  return url.replace(/\/$/, "");
}

/**
 * Safely serializes an object into a JSON string for script tags,
 * escaping `<` characters as `\u003c` to prevent XSS.
 */
export function safeJsonLdString(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/**
 * Standard Open Graph default values for metadata across public pages.
 */
export function getDefaultOpenGraph(overrides?: {
  title?: string;
  description?: string;
  url?: string;
}) {
  const baseUrl = getBaseAppUrl();
  return {
    title: overrides?.title || "يوم الفرح | دليل خدمات الأفراح في بني سويف",
    description:
      overrides?.description ||
      "قاعات وتصوير وميك أب وتجهيزات، كلها من بني سويف. شوفي المتاح في يوم فرحك، وقارني الأعمال والأسعار.",
    url: overrides?.url || baseUrl,
    siteName: "يوم الفرح",
    locale: "ar_EG",
    type: "website" as const,
  };
}

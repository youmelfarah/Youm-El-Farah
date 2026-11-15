import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Revalidates public marketplace catalog pages (/services, /services/[categorySlug]).
 */
export function revalidateMarketplace() {
  try {
    revalidateTag("marketplace", "max");
    revalidateTag("providers", "max");
    revalidatePath("/services");
  } catch (err) {
    console.error("Failed to revalidate marketplace:", err);
  }
}

/**
 * Revalidates a specific provider's public profile and the marketplace listings.
 */
export function revalidateProvider(slug: string, providerId?: string) {
  try {
    revalidateTag("providers", "max");
    revalidateTag(`provider-${slug}`, "max");
    if (providerId) {
      revalidateTag(`provider-id-${providerId}`, "max");
    }
    revalidatePath(`/providers/${slug}`);
    revalidatePath("/services");
  } catch (err) {
    console.error(`Failed to revalidate provider ${slug}:`, err);
  }
}

/**
 * Revalidates categories in marketplace navigation and sitemap.
 */
export function revalidateCategories() {
  try {
    revalidateTag("categories", "max");
    revalidatePath("/services");
  } catch (err) {
    console.error("Failed to revalidate categories:", err);
  }
}

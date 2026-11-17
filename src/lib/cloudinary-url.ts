export type CloudinaryImagePreset = "thumb" | "card" | "gallery" | "cover" | "og" | "hero";

const PRESET_TRANSFORMATIONS: Record<CloudinaryImagePreset, string> = {
  thumb: "c_fill,g_auto,w_200,h_200,f_auto,q_auto",
  card: "c_fill,g_auto,w_640,h_480,f_auto,q_auto",
  gallery: "c_limit,w_1280,h_1280,f_auto,q_auto",
  cover: "c_fill,g_auto,w_1200,h_480,f_auto,q_auto",
  og: "c_fill,g_auto,w_1200,h_630,f_auto,q_auto",
  hero: "c_limit,w_1920,h_1200,f_auto,q_auto",
};

function extractCloudNameFromCloudinaryUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = /^https?:\/\/res\.cloudinary\.com\/([^/]+)\//i.exec(url);
  return match ? match[1] : null;
}

/**
 * Builds a Cloudinary delivery URL from a public_id with preset transformations
 * (f_auto, q_auto, width/height).
 */
export function buildCloudinaryUrl(
  publicId: string,
  preset: CloudinaryImagePreset,
  cloudName?: string
): string {
  const resolvedCloudName =
    cloudName ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    (typeof window === "undefined" ? process.env.CLOUDINARY_CLOUD_NAME : undefined);

  if (!resolvedCloudName) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not configured");
  }

  const cleanPublicId = publicId.replace(/^\/+/, "");
  const encodedPath = cleanPublicId
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `https://res.cloudinary.com/${encodeURIComponent(resolvedCloudName)}/image/upload/${PRESET_TRANSFORMATIONS[preset]}/${encodedPath}`;
}

/**
 * Resolves the display URL for a provider or gallery image using buildCloudinaryUrl
 * when publicId is available, falling back to stored secure URL if needed.
 */
export function resolveCloudinaryDisplayUrl(options: {
  publicId?: string | null;
  fallbackUrl?: string | null;
  preset: CloudinaryImagePreset;
  cloudName?: string;
}): string | null {
  const { publicId, fallbackUrl, preset, cloudName } = options;
  if (publicId) {
    const resolvedCloudName =
      cloudName ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      (typeof window === "undefined"
        ? process.env.CLOUDINARY_CLOUD_NAME
        : undefined) ||
      extractCloudNameFromCloudinaryUrl(fallbackUrl);

    if (resolvedCloudName) {
      return buildCloudinaryUrl(publicId, preset, resolvedCloudName);
    }
  }
  return fallbackUrl ?? null;
}


/**
 * Brand Identity - Single source of truth.
 * All brand references (name, taglines, contact) must import from here.
 */

export interface TeamMember {
  name: string;
  role: string;
  photoPublicId?: string;
}

export interface BrandConfig {
  name: {
    ar: string;
    en: string;
  };
  tagline: string;
  description: string;
  /** International digits, e.g. "201XXXXXXXXX" */
  whatsapp?: string;
  /** Instagram profile URL (e.g. "https://instagram.com/youmelfarah") */
  instagramUrl?: string;
  /** Facebook page URL (e.g. "https://facebook.com/youmelfarah") */
  facebookUrl?: string;
  /** General contact email */
  contactEmail?: string;
  /** Cloudinary public id for the home hero. When empty, uses design-system Placeholder */
  heroImagePublicId?: string;
  /** Team members for /about page. When empty, team block is hidden */
  team?: TeamMember[];
  /** Legacy contact object preserved for backward compatibility */
  contact?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
  };
  /** Legacy social object preserved for backward compatibility */
  social?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
}

export const brand: BrandConfig = {
  name: {
    ar: "يوم الفرح",
    en: "Youm El-Farah",
  },
  tagline: "كل ما تحتاجه العروسة في مكان واحد",
  description: "دليلك الشامل لخدمات وأفراح بني سويف - تصفحي، قارني، واختاري أفضل مقدمي الخدمات.",

  // Cloudinary public id for home hero image (e.g. "youm-el-farah/home/hero-main")
  // When empty or placeholder, falls back to the design-system Placeholder
  heroImagePublicId: "",

  // WhatsApp international digits (e.g. "201275729927")
  whatsapp: "201275729927",

  // Social profiles (leave empty if not configured yet)
  instagramUrl: "",
  facebookUrl: "",

  // Contact email
  contactEmail: "",

  // Team members (rendered on /about ONLY when populated)
  team: [],

  // Legacy mappings for existing code
  contact: {
    phone: "+201275729927",
    email: "",
    whatsapp: "+201275729927",
    address: "",
  },
  social: {
    facebook: "",
    instagram: "",
    tiktok: "",
  },
};

/**
 * Checks whether an optional brand configuration field has a valid, non-placeholder value.
 */
export function isBrandConfigured(val: string | undefined | null): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (
    trimmed === "" ||
    trimmed.includes("...") ||
    trimmed.includes("XXXXXXXXX") ||
    trimmed === "yom-el-farah/site/..."
  ) {
    return false;
  }
  return true;
}

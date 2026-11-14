/**
 * Brand Identity - Single source of truth.
 * All brand references (name, taglines, contact) must import from here.
 */
export const brand = {
  name: {
    ar: "يوم الفرح",
    en: "Youm El-Farah",
  },
  tagline: "كل ما تحتاجه العروسة في مكان واحد",
  description: "دليلك الشامل لخدمات وأفراح بني سويف - تصفحي، قارني، واختاري أفضل مقدمي الخدمات.",
  contact: {
    phone: "",
    email: "",
    whatsapp: "",
    address: "",
  },
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
  },
} as const;

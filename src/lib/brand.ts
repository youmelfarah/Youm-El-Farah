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
    phone: "+201275729927",
    email: "",
    whatsapp: "+201275729927",
    address: "",
  },
  social: {
    facebook: "", // رابط فيسبوك (مثال: https://facebook.com/...)
    instagram: "", // رابط انستجرام (مثال: https://instagram.com/...)
    tiktok: "",
  },
} as const;

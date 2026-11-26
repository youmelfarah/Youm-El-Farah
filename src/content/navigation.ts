/**
 * Navigation Content - Public Header & Footer
 */

export const navigationContent = {
  header: {
    links: [
      { href: "/", label: "الرئيسية" },
      { href: "/services", label: "الخدمات" },
      { href: "/about", label: "من نحن" },
      { href: "/contact", label: "تواصل معنا" },
    ],
    actions: {
      join: "انضم كمقدم خدمة",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      adminDashboard: "لوحة الإدارة",
      providerDashboard: "لوحة مقدم الخدمة",
      myAccount: "حسابي",
      favorites: "المفضلة",
      myReviews: "تقييماتي",
    },
  },
  footer: {
    tagline: "دليل خدمات الأفراح في بني سويف.",
    sections: {
      site: {
        title: "الموقع",
        links: [
          { href: "/", label: "الرئيسية" },
          { href: "/services", label: "الخدمات" },
          { href: "/about", label: "من نحن" },
          { href: "/contact", label: "تواصل معنا" },
        ],
      },
      providers: {
        title: "لمقدمي الخدمة",
        links: [
          { href: "/join", label: "انضم كمقدم خدمة" },
          { href: "/login", label: "تسجيل الدخول" },
        ],
      },
      social: {
        title: "تابعينا",
        instagramLabel: "إنستجرام",
        facebookLabel: "فيسبوك",
        whatsappLabel: "واتساب",
      },
    },
    bottom: {
      privacy: "الخصوصية",
      terms: "الشروط",
      copyright: "يوم الفرح",
    },
  },
} as const;

import type { Metadata, Viewport } from "next";
import { El_Messiri, IBM_Plex_Sans_Arabic, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import { getBaseAppUrl } from "@/lib/seo";
import "./globals.css";

const elMessiri = El_Messiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
  variable: "--font-display-ar",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
  variable: "--font-body",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
  variable: "--font-display-latin",
});

export const viewport: Viewport = {
  themeColor: "#17120F",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "يوم الفرح - دليل خدمات الأفراح في بني سويف",
    template: "%s | يوم الفرح",
  },
  description:
    "يوم الفرح هو دليلك الشامل لخدمات الأفراح في بني سويف. تصفحي، قارني، واختاري أفضل مقدمي خدمات الزفاف.",
  metadataBase: new URL(getBaseAppUrl()),
  openGraph: {
    title: "يوم الفرح - دليل خدمات الأفراح في بني سويف",
    description: "قاعات وتصوير وميك أب وتجهيزات، كلها من بني سويف.",
    url: getBaseAppUrl(),
    siteName: "يوم الفرح",
    locale: "ar_EG",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" data-theme="light" suppressHydrationWarning>
      <body
        className={`${elMessiri.variable} ${ibmPlexArabic.variable} ${cormorant.variable} min-h-screen bg-surface font-body text-text antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

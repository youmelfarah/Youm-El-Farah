import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "يوم الفرح - دليل خدمات الأفراح في بني سويف",
  description:
    "يوم الفرح هو دليلك الشامل لخدمات الأفراح في بني سويف. تصفحي، قارني، واختاري أفضل مقدمي خدمات الزفاف.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}

import Link from "next/link";
import {
  WhatsappLogo,
  InstagramLogo,
  FacebookLogo,
} from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { brand, isBrandConfigured } from "@/lib/brand";
import { normalizeWhatsAppDigits } from "@/lib/whatsapp";

export function PublicFooter() {
  const hasInstagram = isBrandConfigured(brand.instagramUrl);
  const hasFacebook = isBrandConfigured(brand.facebookUrl);
  const hasWhatsApp = isBrandConfigured(brand.whatsapp);
  const waDigits = hasWhatsApp ? normalizeWhatsAppDigits(brand.whatsapp) : null;

  return (
    <footer className="border-t border-[#E6DACB] bg-[#F6F0E8] text-[#1C1917] transition-colors">
      <Container className="py-12 sm:py-16">
        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {/* Col 1: Brand Info */}
          <div className="flex flex-col gap-4">
            <Logo variant="stacked" size="md" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-accent-text tracking-wide">
                دليل خدمات الأفراح في بني سويف
              </span>
              <p className="text-xs text-[#57534E] leading-relaxed max-w-sm mt-1">
                منصتكِ الأولى لاكتشاف وتجهيز كل تفاصيل زفافكِ في بني سويف بسهولة وثقة وبدون وسيط.
              </p>
            </div>

            {/* Circular Social / Contact Icon Buttons */}
            <div className="flex items-center gap-2.5 mt-1">
              {waDigits && (
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-white border border-[#E6DACB] flex items-center justify-center text-[#1C1917] hover:bg-[#FAF6F0] hover:text-accent-text hover:border-accent-text transition-colors shadow-2xs"
                  aria-label="تواصل عبر واتساب"
                >
                  <WhatsappLogo className="h-4 w-4" weight="light" />
                </a>
              )}

              {hasInstagram ? (
                <a
                  href={brand.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-white border border-[#E6DACB] flex items-center justify-center text-[#1C1917] hover:bg-[#FAF6F0] hover:text-accent-text hover:border-accent-text transition-colors shadow-2xs"
                  aria-label="صفحة إنستجرام"
                >
                  <InstagramLogo className="h-4 w-4" weight="light" />
                </a>
              ) : (
                /* Social link placeholder: Instagram (configure instagramUrl in src/lib/brand.ts) */
                null
              )}

              {hasFacebook ? (
                <a
                  href={brand.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 rounded-full bg-white border border-[#E6DACB] flex items-center justify-center text-[#1C1917] hover:bg-[#FAF6F0] hover:text-accent-text hover:border-accent-text transition-colors shadow-2xs"
                  aria-label="صفحة فيسبوك"
                >
                  <FacebookLogo className="h-4 w-4" weight="light" />
                </a>
              ) : (
                /* Social link placeholder: Facebook (configure facebookUrl in src/lib/brand.ts) */
                null
              )}
            </div>
          </div>

          {/* Col 2: الموقع */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-[#1C1917]">
              الموقع
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#57534E]">
              <li>
                <Link
                  href="/"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  الخدمات
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  من نحن
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: أشهر الخدمات */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-[#1C1917]">
              أشهر الخدمات
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#57534E]">
              <li>
                <Link
                  href="/services/venues"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  القاعات
                </Link>
              </li>
              <li>
                <Link
                  href="/services/photographer"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  مصور فوتوغرافي
                </Link>
              </li>
              <li>
                <Link
                  href="/services/makeup-artist"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  ميك اب ارتيست
                </Link>
              </li>
              <li>
                <Link
                  href="/services/atelier"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  الأتيليه
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: لمقدمي الخدمة */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-[#1C1917]">
              لمقدمي الخدمة
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#57534E]">
              <li>
                <Link
                  href="/join"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  انضم كمقدم خدمة
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-accent-text transition-colors inline-block min-h-[28px] py-1"
                >
                  تسجيل الدخول
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E6DACB] pt-6 sm:flex-row text-xs text-[#57534E]">
          <p>© 2026 يوم الفرح — جميع الحقوق محفوظة</p>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-accent-text transition-colors py-1">
              الخصوصية
            </Link>
            <Link href="/terms" className="hover:text-accent-text transition-colors py-1">
              الشروط والأحكام
            </Link>
          </div>

          <p className="text-accent-text font-medium">صُنع بحب لعرايس بني سويف</p>
        </div>
      </Container>
    </footer>
  );
}

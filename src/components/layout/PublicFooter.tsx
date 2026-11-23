import Link from "next/link";
import { MapPin, Heart, MessageCircle } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { brand, isBrandConfigured } from "@/lib/brand";
import { normalizeWhatsAppDigits } from "@/lib/whatsapp";

export function PublicFooter() {
  const hasWhatsApp = isBrandConfigured(brand.whatsapp);
  const waDigits = hasWhatsApp ? normalizeWhatsAppDigits(brand.whatsapp) : "201275729927";

  return (
    <footer className="relative border-t-2 border-[#E7D8C8] bg-[#F2E9DF] text-[#1C1917] transition-colors">
      {/* Delicate warm bridal top accent glow bar */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#B84A62]/35 to-transparent" />

      <Container className="py-12 lg:py-14">
        {/* Balanced 4-Column Responsive Grid (4 + 2 + 3 + 3 = 12) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Column 1 — Brand (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <Logo variant="stacked" size="md" />
            <span className="text-xs font-semibold text-[#9E3B52] tracking-wide mt-1">
              دليل خدمات الأفراح في بني سويف
            </span>
            <p className="text-xs text-[#57534E] leading-relaxed max-w-sm">
              منصتك الأولى لاكتشاف وتجهيز كل تفاصيل زفافك في بني سويف بسهولة وثقة وبدون وسيط.
            </p>

            {/* Grounded Location Tag */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#2A1E1B] mt-2">
              <MapPin className="w-4 h-4 text-[#B84A62] shrink-0" />
              <span>بني سويف، مصر</span>
            </div>
          </div>

          {/* Column 2 — الموقع (lg:col-span-2) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-[#2A1E1B]">
              الموقع
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#57534E]">
              <li>
                <Link
                  href="/"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  الخدمات
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  من نحن
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — أشهر الخدمات (lg:col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-[#2A1E1B]">
              أشهر الخدمات
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#57534E]">
              <li>
                <Link
                  href="/services/venues"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  القاعات
                </Link>
              </li>
              <li>
                <Link
                  href="/services/photographer"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  مصور فوتوغرافي
                </Link>
              </li>
              <li>
                <Link
                  href="/services/makeup-artist"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  ميك اب ارتيست
                </Link>
              </li>
              <li>
                <Link
                  href="/services/atelier"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  الأتيليه
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 — لمقدمي الخدمة + مساعدة سريعة (lg:col-span-3) */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-[#2A1E1B]">
              لمقدمي الخدمة
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-[#57534E]">
              <li>
                <Link
                  href="/join"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  انضم كمقدم خدمة
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-[#B84A62] transition-colors inline-block min-h-[28px] py-1"
                >
                  تسجيل الدخول
                </Link>
              </li>
            </ul>

            {/* Quick Support Card */}
            <div className="bg-white/85 rounded-2xl p-4 border border-[#E6D7C7] mt-3 shadow-xs">
              <h5 className="font-display text-xs font-bold text-[#2A1E1B] mb-1">
                محتاجة مساعدة؟
              </h5>
              <p className="text-[11px] text-[#6B625A] mb-3 leading-relaxed">
                فريقنا جاهز لمساعدتك في تنسيق خدمات فرحك والرد على أي استفسار.
              </p>
              <a
                href={`https://wa.me/${waDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] py-2 px-3 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors border border-[#25D366]/25"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل واتساب</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#E2D3C2] pt-6 sm:flex-row text-xs text-[#57534E]">
          <p>© 2026 يوم الفرح — جميع الحقوق محفوظة</p>

          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-[#B84A62] transition-colors py-1">
              الخصوصية
            </Link>
            <span className="text-[#D8C7B5]">·</span>
            <Link href="/terms" className="hover:text-[#B84A62] transition-colors py-1">
              الشروط والأحكام
            </Link>
          </div>

          <div className="text-xs text-[#57534E] flex items-center gap-1 font-medium">
            <span>صُنع بـ</span>
            <Heart className="w-3.5 h-3.5 fill-[#B84A62] text-[#B84A62] inline mx-1" />
            <span>لعرايس بني سويف</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

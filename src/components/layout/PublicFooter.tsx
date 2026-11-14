import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { brand } from "@/lib/brand";

export function PublicFooter() {
  return (
    <footer
      data-theme="dark"
      style={{
        backgroundColor: "var(--surface)",
        color: "var(--text)",
      }}
      className="border-t border-border bg-surface text-text transition-colors"
    >
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="flex flex-col gap-4 sm:col-span-2">
            <Logo variant="stacked" size="md" />
            <p className="max-w-sm text-sm text-text-muted leading-relaxed">
              {brand.description}
            </p>
            <span className="font-latin text-xs text-accent-text tracking-wider uppercase mt-2">
              Beni Suef, Egypt
            </span>
          </div>

          {/* Links Col 1 */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-text">
              دليل الخدمات
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-text-muted">
              <li>
                <Link href="#venues" className="hover:text-text transition-colors">
                  قاعات الأفراح
                </Link>
              </li>
              <li>
                <Link href="#photography" className="hover:text-text transition-colors">
                  المصورين والفيديو
                </Link>
              </li>
              <li>
                <Link href="#dresses" className="hover:text-text transition-colors">
                  فساتين وبدلات
                </Link>
              </li>
              <li>
                <Link href="#beauty" className="hover:text-text transition-colors">
                  الميك أب والشعر
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-text">
              مقدمو الخدمات
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-text-muted">
              <li>
                <Link href="/login" className="hover:text-text transition-colors">
                  انضم كشريك
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-text transition-colors">
                  لوحة الشركاء
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-text transition-colors">
                  الباقات والاشتراكات
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 3 */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-text">
              عن المنصة
            </h4>
            <ul className="flex flex-col gap-2 text-xs text-text-muted">
              <li>
                <Link href="#about" className="hover:text-text transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-text transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link href="#contact" className="hover:text-text transition-colors">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Small Print Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row text-xs text-text-muted">
          <p>
            جميع الحقوق محفوظة © 2026 {brand.name.ar}. بني سويف.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#privacy" className="hover:text-text transition-colors">
              سياسة الخصوصية
            </Link>
            <Link href="#terms" className="hover:text-text transition-colors">
              شروط الاستخدام
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { BrandConfigHint } from "@/components/brand/brand-config-hint";
import { brand, isBrandConfigured } from "@/lib/brand";
import { navigationContent } from "@/content/navigation";
import { normalizeWhatsAppDigits } from "@/lib/whatsapp";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const content = navigationContent.footer;

  const hasInstagram = isBrandConfigured(brand.instagramUrl);
  const hasFacebook = isBrandConfigured(brand.facebookUrl);
  const hasWhatsApp = isBrandConfigured(brand.whatsapp);
  const waDigits = hasWhatsApp ? normalizeWhatsAppDigits(brand.whatsapp) : null;

  const hasAnySocial = hasInstagram || hasFacebook || Boolean(waDigits);

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
          {/* Brand Info Col */}
          <div className="flex flex-col gap-4 sm:col-span-2">
            <Logo variant="stacked" size="md" />
            <p className="max-w-sm text-sm text-text-muted leading-relaxed">
              {content.tagline}
            </p>
            <span className="font-latin text-xs text-accent-text tracking-wider uppercase mt-1">
              BENI SUEF · WEDDINGS
            </span>
          </div>

          {/* Col 1: الموقع */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-text">
              {content.sections.site.title}
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-text-muted">
              {content.sections.site.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-text transition-colors inline-block min-h-[28px] py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: لمقدمي الخدمة */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-text">
              {content.sections.providers.title}
            </h4>
            <ul className="flex flex-col gap-2.5 text-xs text-text-muted">
              {content.sections.providers.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-text transition-colors inline-block min-h-[28px] py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: تابعينا */}
          <div className="flex flex-col gap-3">
            <h4 className="font-display text-sm font-semibold text-text">
              {content.sections.social.title}
            </h4>

            {hasAnySocial ? (
              <ul className="flex flex-col gap-2.5 text-xs text-text-muted">
                {hasInstagram && (
                  <li>
                    <a
                      href={brand.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text transition-colors inline-block min-h-[28px] py-1"
                    >
                      {content.sections.social.instagramLabel}
                    </a>
                  </li>
                )}
                {hasFacebook && (
                  <li>
                    <a
                      href={brand.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text transition-colors inline-block min-h-[28px] py-1"
                    >
                      {content.sections.social.facebookLabel}
                    </a>
                  </li>
                )}
                {waDigits && (
                  <li>
                    <a
                      href={`https://wa.me/${waDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-text transition-colors inline-block min-h-[28px] py-1"
                    >
                      {content.sections.social.whatsappLabel}
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <div className="text-xs text-text-muted">
                <BrandConfigHint field="social" />
              </div>
            )}
          </div>
        </div>

        {/* Small Print Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row text-xs text-text-muted">
          <p>
            جميع الحقوق محفوظة © {currentYear} {content.bottom.copyright}. بني سويف.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-text transition-colors py-1">
              {content.bottom.privacy}
            </Link>
            <Link href="/terms" className="hover:text-text transition-colors py-1">
              {content.bottom.terms}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

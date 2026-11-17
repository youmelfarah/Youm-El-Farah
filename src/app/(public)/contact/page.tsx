import type { Metadata } from "next";
import { ArrowUpLeft, WhatsappLogo } from "@phosphor-icons/react/dist/ssr";
import { getWeddingDateFromCookie } from "@/lib/wedding-date";
import { getBaseAppUrl } from "@/lib/seo";
import { brand, isBrandConfigured } from "@/lib/brand";
import { contactContent } from "@/content/contact";
import { normalizeWhatsAppDigits } from "@/lib/whatsapp";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { BrandConfigHint } from "@/components/brand/brand-config-hint";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseAppUrl();
  return {
    title: contactContent.seo.title,
    description: contactContent.seo.description,
    alternates: {
      canonical: `${baseUrl}/contact`,
    },
    openGraph: {
      title: contactContent.seo.title,
      description: contactContent.seo.description,
      url: `${baseUrl}/contact`,
      siteName: brand.name.ar,
      locale: "ar_EG",
      type: "website",
    },
  };
}

export default async function ContactPage() {
  const weddingDate = await getWeddingDateFromCookie();

  const hasWhatsApp = isBrandConfigured(brand.whatsapp);
  const waDigits = hasWhatsApp ? normalizeWhatsAppDigits(brand.whatsapp) : null;
  const hasInstagram = isBrandConfigured(brand.instagramUrl);
  const hasFacebook = isBrandConfigured(brand.facebookUrl);
  const hasEmail = isBrandConfigured(brand.contactEmail);

  const hasAnyChannel = Boolean(waDigits || hasInstagram || hasFacebook || hasEmail);

  const whatsappUrl = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(contactContent.channels.whatsapp.prefilledText)}`
    : null;

  return (
    <>
      <PublicHeader variant="solid" initialWeddingDate={weddingDate} />

      <Section spacing="default" className="bg-surface">
        <Container size="narrow">
          <Reveal>
            <div className="border-b border-border pb-10 sm:pb-12">
              <span className="font-latin text-xs font-semibold tracking-[0.18em] text-accent-text uppercase">
                {contactContent.hero.eyebrow}
              </span>
              <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold text-text leading-tight">
                {contactContent.hero.title}
              </h1>
              <p className="mt-6 text-base sm:text-lg text-text-muted leading-[1.85] max-w-2xl">
                {contactContent.hero.paragraph}
              </p>
            </div>
          </Reveal>

          {/* Contact Channels List */}
          <div className="mt-6">
            {hasAnyChannel ? (
              <div className="border-b border-border">
                {/* 1. WhatsApp (Primary channel) */}
                {whatsappUrl && (
                  <Reveal delay={0.02}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border py-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-xl font-bold text-text">
                            {contactContent.channels.whatsapp.title}
                          </h2>
                          <span className="rounded-[2px] bg-success-muted px-2 py-0.5 text-[11px] font-semibold text-success border border-success/30">
                            مباشر وسريع
                          </span>
                        </div>
                        <p className="text-sm text-text-muted">
                          {contactContent.channels.whatsapp.subtitle}
                        </p>
                      </div>

                      <Button asChild variant="primary" size="lg" className="min-h-[44px] gap-2">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <WhatsappLogo className="h-5 w-5" weight="fill" />
                          <span>{contactContent.channels.whatsapp.buttonText}</span>
                        </a>
                      </Button>
                    </div>
                  </Reveal>
                )}

                {/* 2. Instagram */}
                {hasInstagram && (
                  <Reveal delay={0.05}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border py-8">
                      <div className="flex flex-col gap-1">
                        <h2 className="font-display text-xl font-bold text-text">
                          {contactContent.channels.instagram.title}
                        </h2>
                        <p className="text-sm text-text-muted">
                          {contactContent.channels.instagram.subtitle}
                        </p>
                      </div>

                      <Button asChild variant="secondary" size="md" className="min-h-[44px] gap-2">
                        <a
                          href={brand.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>{contactContent.channels.instagram.actionText}</span>
                          <ArrowUpLeft className="h-4 w-4" weight="light" />
                        </a>
                      </Button>
                    </div>
                  </Reveal>
                )}

                {/* 3. Facebook */}
                {hasFacebook && (
                  <Reveal delay={0.08}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border py-8">
                      <div className="flex flex-col gap-1">
                        <h2 className="font-display text-xl font-bold text-text">
                          {contactContent.channels.facebook.title}
                        </h2>
                        <p className="text-sm text-text-muted">
                          {contactContent.channels.facebook.subtitle}
                        </p>
                      </div>

                      <Button asChild variant="secondary" size="md" className="min-h-[44px] gap-2">
                        <a
                          href={brand.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>{contactContent.channels.facebook.actionText}</span>
                          <ArrowUpLeft className="h-4 w-4" weight="light" />
                        </a>
                      </Button>
                    </div>
                  </Reveal>
                )}

                {/* 4. Email */}
                {hasEmail && (
                  <Reveal delay={0.1}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border py-8 last:border-b-0">
                      <div className="flex flex-col gap-1">
                        <h2 className="font-display text-xl font-bold text-text">
                          {contactContent.channels.email.title}
                        </h2>
                        <p className="text-sm text-text-muted">
                          {contactContent.channels.email.subtitle}
                        </p>
                      </div>

                      <Button asChild variant="secondary" size="md" className="min-h-[44px] gap-2">
                        <a href={`mailto:${brand.contactEmail}`}>
                          <span>{contactContent.channels.email.actionText}</span>
                          <ArrowUpLeft className="h-4 w-4" weight="light" />
                        </a>
                      </Button>
                    </div>
                  </Reveal>
                )}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-base text-text-muted">
                  {contactContent.fallback}
                </p>
                <div className="mt-4">
                  <BrandConfigHint field="contact channels" />
                </div>
              </div>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

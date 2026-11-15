import type { Metadata } from "next";
import Link from "next/link";
import { WhatsappLogo, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { getWeddingDateFromCookie } from "@/lib/wedding-date";
import { getBaseAppUrl } from "@/lib/seo";
import { brand, isBrandConfigured } from "@/lib/brand";
import { joinContent } from "@/content/join";
import { normalizeWhatsAppDigits } from "@/lib/whatsapp";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { BrandConfigHint } from "@/components/brand/brand-config-hint";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseAppUrl();
  return {
    title: joinContent.seo.title,
    description: joinContent.seo.description,
    alternates: {
      canonical: `${baseUrl}/join`,
    },
    openGraph: {
      title: joinContent.seo.title,
      description: joinContent.seo.description,
      url: `${baseUrl}/join`,
      siteName: brand.name.ar,
      locale: "ar_EG",
      type: "website",
    },
  };
}

export default async function JoinPage() {
  const weddingDate = await getWeddingDateFromCookie();

  const hasWhatsApp = isBrandConfigured(brand.whatsapp);
  const waDigits = hasWhatsApp ? normalizeWhatsAppDigits(brand.whatsapp) : null;
  const whatsappUrl = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(joinContent.actions.whatsappPrefill)}`
    : null;

  return (
    <>
      <PublicHeader variant="solid" initialWeddingDate={weddingDate} />

      {/* 1. Dark Hero Band */}
      <section
        data-theme="dark"
        style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
        className="w-full border-b border-border bg-surface text-text py-16 sm:py-24"
      >
        <Container size="narrow">
          <Reveal>
            <span className="font-latin text-xs font-semibold tracking-[0.18em] text-accent-text uppercase">
              {joinContent.hero.eyebrow}
            </span>
            <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold text-text leading-tight">
              {joinContent.hero.title}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-text-muted leading-[1.85]">
              {joinContent.hero.lead}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* 2. Benefits (إيه اللي هتاخده) */}
      <Section spacing="default" className="border-b border-border bg-surface">
        <Container size="narrow">
          <Reveal>
            <SectionHeading
              eyebrow={joinContent.benefits.eyebrow}
              title={joinContent.benefits.title}
            />
          </Reveal>

          <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {joinContent.benefits.items.map((item, idx) => (
              <Reveal key={idx} delay={idx * 80}>
                <div className="flex items-start gap-4 p-6 rounded-[4px] border border-border bg-surface-raised">
                  <CheckCircle className="h-5 w-5 text-accent-text shrink-0 mt-0.5" weight="fill" />
                  <p className="font-display font-medium text-base text-text leading-snug">
                    {item}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* 3. Steps (إزاي تبدأ) */}
      <Section spacing="default" className="border-b border-border bg-surface-raised">
        <Container size="narrow">
          <Reveal>
            <SectionHeading
              eyebrow={joinContent.steps.eyebrow}
              title={joinContent.steps.title}
            />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {joinContent.steps.list.map((step, idx) => (
              <Reveal key={step.number} delay={idx * 100}>
                <div className="flex flex-col gap-3 p-6 rounded-[4px] border border-border bg-surface">
                  <span className="font-latin text-3xl sm:text-4xl font-medium text-accent-text">
                    {step.number}
                  </span>
                  <h3 className="font-display text-lg font-bold text-text">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-[1.85]">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* 4. Pricing & Final Action CTA (NO prices in UI) */}
      <Section spacing="default" className="bg-surface">
        <Container size="narrow">
          <Reveal>
            <div className="rounded-[4px] border border-border bg-surface-raised p-8 sm:p-12 text-center">
              <span className="font-latin text-xs font-semibold tracking-[0.18em] text-accent-text uppercase">
                {joinContent.pricing.eyebrow}
              </span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-text">
                {joinContent.pricing.title}
              </h2>
              <p className="mt-4 text-base text-text-muted max-w-xl mx-auto leading-relaxed">
                {joinContent.pricing.text}
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                {whatsappUrl ? (
                  <Button asChild variant="primary" size="lg" className="min-h-[44px] gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsappLogo className="h-5 w-5" weight="fill" />
                      <span>{joinContent.actions.whatsappButton}</span>
                    </a>
                  </Button>
                ) : (
                  <BrandConfigHint field="whatsapp" />
                )}

                <Button asChild variant="secondary" size="lg" className="min-h-[44px]">
                  <Link href={joinContent.actions.loginHref}>
                    {joinContent.actions.loginPrompt}
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { getWeddingDateFromCookie } from "@/lib/wedding-date";
import { getBaseAppUrl } from "@/lib/seo";
import { brand } from "@/lib/brand";
import { termsContent, legalNotice } from "@/content/legal";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseAppUrl();
  return {
    title: termsContent.seo.title,
    description: termsContent.seo.description,
    alternates: {
      canonical: `${baseUrl}/terms`,
    },
    openGraph: {
      title: termsContent.seo.title,
      description: termsContent.seo.description,
      url: `${baseUrl}/terms`,
      siteName: brand.name.ar,
      locale: "ar_EG",
      type: "website",
    },
  };
}

export default async function TermsPage() {
  const weddingDate = await getWeddingDateFromCookie();

  return (
    <>
      <PublicHeader variant="solid" initialWeddingDate={weddingDate} />

      <Section spacing="default" className="bg-surface">
        <Container size="narrow">
          <Reveal>
            <div className="border-b border-border pb-8 mb-8">
              <span className="font-latin text-xs font-semibold tracking-[0.18em] text-accent-text uppercase">
                {termsContent.hero.eyebrow}
              </span>
              <h1 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-text leading-tight">
                {termsContent.hero.title}
              </h1>
              <p className="mt-3 text-xs text-text-muted">
                آخر تحديث: {termsContent.lastUpdated}
              </p>

              {/* Developer / Site Owner Note */}
              <div className="mt-4 rounded-[4px] border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                {legalNotice}
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col gap-10">
            {termsContent.sections.map((sec, idx) => (
              <Reveal key={idx} delay={idx * 60}>
                <article className="border-b border-border/50 pb-8 last:border-b-0">
                  <h2 className="font-display text-lg sm:text-xl font-bold text-text mb-3">
                    {sec.title}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {sec.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="text-sm text-text-muted leading-[1.85]">
                        {p}
                      </p>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { getWeddingDateFromCookie } from "@/lib/wedding-date";
import { getBaseAppUrl } from "@/lib/seo";
import { brand, isBrandConfigured } from "@/lib/brand";
import { aboutContent } from "@/content/about";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CloudinaryImage } from "@/components/ui/cloudinary-image";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getBaseAppUrl();
  return {
    title: aboutContent.seo.title,
    description: aboutContent.seo.description,
    alternates: {
      canonical: `${baseUrl}/about`,
    },
    openGraph: {
      title: aboutContent.seo.title,
      description: aboutContent.seo.description,
      url: `${baseUrl}/about`,
      siteName: brand.name.ar,
      locale: "ar_EG",
      type: "website",
    },
  };
}

export default async function AboutPage() {
  const weddingDate = await getWeddingDateFromCookie();
  const hasTeam = Boolean(brand.team && brand.team.length > 0);

  return (
    <>
      {/* Solid Sticky Header */}
      <PublicHeader variant="solid" initialWeddingDate={weddingDate} />

      {/* 1. Dark Band with H1 & Lead */}
      <section
        data-theme="dark"
        style={{ backgroundColor: "var(--surface)", color: "var(--text)" }}
        className="w-full border-b border-border bg-surface text-text py-16 sm:py-24"
      >
        <Container size="narrow">
          <Reveal>
            <span className="font-latin text-xs font-semibold tracking-[0.18em] text-accent-text uppercase">
              {aboutContent.hero.eyebrow}
            </span>
            <h1 className="mt-4 font-display text-3xl sm:text-5xl font-bold text-text leading-tight">
              {aboutContent.hero.title}
            </h1>
            <p className="mt-6 text-base sm:text-lg text-text-muted leading-[1.85]">
              {aboutContent.hero.lead}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* 2. Light Editorial Two-Column Section */}
      <Section spacing="default" className="bg-surface">
        <Container size="narrow">
          <div className="flex flex-col gap-12 sm:gap-16">
            {aboutContent.sections.map((sec, idx) => (
              <Reveal key={sec.id} delay={idx * 80}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-start border-b border-border/60 pb-10 sm:pb-12 last:border-b-0">
                  <div className="md:col-span-4">
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-text">
                      {sec.title}
                    </h2>
                  </div>
                  <div className="md:col-span-8">
                    <p className="text-sm sm:text-base text-text-muted leading-[1.85]">
                      {sec.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}

            {/* Optional Team Block (Rendered ONLY if brand.team has entries) */}
            {hasTeam && (
              <Reveal delay={200}>
                <div className="pt-8 border-t border-border">
                  <SectionHeading
                    eyebrow={aboutContent.team.eyebrow}
                    title={aboutContent.team.title}
                  />

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {brand.team!.map((member) => (
                      <div
                        key={member.name}
                        className="flex flex-col items-center text-center p-6 rounded-[4px] border border-border bg-surface-raised"
                      >
                        <div className="h-20 w-20 overflow-hidden rounded-full mb-4 border border-border bg-surface-muted">
                          {member.photoPublicId ? (
                            <CloudinaryImage
                              publicId={member.photoPublicId}
                              alt={member.name}
                              aspectRatio="1:1"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Avatar className="h-full w-full">
                              <AvatarFallback className="text-lg font-display">
                                {member.name.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <h3 className="font-display font-semibold text-base text-text">
                          {member.name}
                        </h3>
                        <p className="text-xs text-text-muted mt-1">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* CTA Row */}
            <Reveal delay={250}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-[4px] border border-border bg-surface-raised p-6 sm:p-8 mt-4">
                <div className="text-center sm:text-start">
                  <h3 className="font-display text-lg font-bold text-text">
                    {aboutContent.cta.question}
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    تواصل معنا مباشرة أو انضم للمنصة كشريك معتمد
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild variant="secondary" size="md" className="min-h-[44px]">
                    <Link href={aboutContent.cta.contactHref}>
                      {aboutContent.cta.contactButton}
                    </Link>
                  </Button>
                  <Button asChild variant="primary" size="md" className="min-h-[44px]">
                    <Link href={aboutContent.cta.joinHref}>
                      <span>{aboutContent.cta.joinButton}</span>
                      <ArrowLeft className="h-4 w-4" weight="light" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>
    </>
  );
}

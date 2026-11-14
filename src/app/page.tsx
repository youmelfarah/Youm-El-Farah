import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Placeholder } from "@/components/ui/placeholder";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-text">
      {/* Hero Section */}
      <Section spacing="default" className="border-b border-border">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            <div className="flex flex-col gap-6 lg:col-span-6">
              <SectionHeading
                eyebrow="BENI SUEF WEDDING DIRECTORY"
                title="كل ما تحتاجه العروسة في مكان واحد"
                description="دليلكِ الشامل لاختيار أرقى قاعات الأفراح واستوديوهات التصوير ومصممي الديكور في بني سويف. مقارنات شفافة، أسعار معلنة، وتأكيد فوري للحجز."
              />

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button asChild variant="primary" size="lg">
                  <Link href="/login">
                    <span>انضم كمقدم خدمة</span>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/styleguide">دليل نظام التصميم (Style Guide)</Link>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-border pt-6 mt-4">
                <div>
                  <span className="font-latin text-2xl font-bold text-text">100%</span>
                  <p className="text-xs text-text-muted mt-0.5">مقدمو خدمات موثقون</p>
                </div>
                <div>
                  <span className="font-latin text-2xl font-bold text-text">0-9</span>
                  <p className="text-xs text-text-muted mt-0.5">أرقام وتواريخ غربية</p>
                </div>
                <div>
                  <span className="font-latin text-2xl font-bold text-text">4.9/5</span>
                  <p className="text-xs text-text-muted mt-0.5">تقييم العرائس</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <Placeholder
                  aspectRatio="4:5"
                  label="EDITORIAL PORTRAIT 4:5"
                  className="border-border-strong"
                />
                <div className="flex flex-col gap-4">
                  <Placeholder
                    aspectRatio="1:1"
                    label="ATMOSPHERE 1:1"
                  />
                  <Placeholder
                    aspectRatio="16:9"
                    label="CINEMATIC 16:9"
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

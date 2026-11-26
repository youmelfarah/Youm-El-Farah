import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "@/lib/provider-visibility";
import type { PublicProviderCardData } from "@/lib/marketplace-query";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProviderCard } from "@/components/marketplace/provider-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "قائمة اختيارات الفرح | يوم الفرح",
  robots: {
    index: false,
    follow: false,
  },
};

function getFirstNameOnly(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  if (!first || first.includes("@")) return "العروسة";
  return first;
}

export default async function SharedFavoritesListPage(props: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await props.params;
  const cleanToken = token?.trim();
  if (!cleanToken) {
    notFound();
  }

  const owner = await prisma.user.findUnique({
    where: { favoritesShareToken: cleanToken },
    select: {
      id: true,
      name: true,
      isActive: true,
      banned: true,
    },
  });

  if (!owner || !owner.isActive || owner.banned) {
    notFound();
  }

  const firstName = getFirstNameOnly(owner.name);

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: owner.id,
      provider: visibleProviderWhere(),
    },
    orderBy: { createdAt: "desc" },
    select: {
      provider: {
        select: {
          id: true,
          slug: true,
          name: true,
          district: true,
          logoUrl: true,
          coverUrl: true,
          averageRating: true,
          reviewCount: true,
          rankScore: true,
          createdAt: true,
          categories: {
            select: {
              isPrimary: true,
              category: { select: { id: true, slug: true, nameAr: true } },
            },
          },
          offers: {
            where: { isActive: true },
            select: { price: true },
          },
        },
      },
    },
  });

  const groupsMap = new Map<
    string,
    { categoryId: string; categoryName: string; providers: PublicProviderCardData[] }
  >();

  for (const fav of favorites) {
    const p = fav.provider;
    const primaryCat =
      p.categories.find((c) => c.isPrimary)?.category ||
      p.categories[0]?.category ||
      null;
    const prices = p.offers
      .map((o) => o.price)
      .filter((pr): pr is number => typeof pr === "number" && pr !== null);

    const card: PublicProviderCardData = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      district: p.district,
      logoUrl: p.logoUrl,
      coverUrl: p.coverUrl,
      averageRating: p.averageRating,
      reviewCount: p.reviewCount,
      rankScore: p.rankScore,
      createdAt: p.createdAt,
      primaryCategory: primaryCat,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
    };

    const groupId = primaryCat?.id ?? "other";
    const groupName = primaryCat?.nameAr ?? "خدمات أخرى";
    const existing = groupsMap.get(groupId);
    if (existing) {
      existing.providers.push(card);
    } else {
      groupsMap.set(groupId, {
        categoryId: groupId,
        categoryName: groupName,
        providers: [card],
      });
    }
  }

  const groups = Array.from(groupsMap.values());

  return (
    <div className="min-h-screen bg-surface text-text">
      <PublicHeader />
      <Section spacing="sm">
        <Container className="space-y-8">
          <SectionHeading
            as="h1"
            eyebrow="SHARED WISHLIST"
            title={`اختيارات ${firstName}`}
            description="قائمة خاصة بمقدمي خدمات الزفاف المختارين على منصة يوم الفرح (للعرض فقط)."
          />

          {groups.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-6 w-6" weight="light" />}
              title="القائمة فارغة حالياً"
              description="لا توجد خدمات متاحة في هذه القائمة في الوقت الحالي."
              action={
                <Button asChild variant="primary">
                  <Link href="/services">تصفحي دليل الخدمات</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-10">
              {groups.map((group) => (
                <section key={group.categoryId} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h2 className="font-display text-lg font-semibold text-text">
                      {group.categoryName}
                    </h2>
                    <span className="font-latin text-xs text-text-muted">
                      {group.providers.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {group.providers.map((p) => (
                      <ProviderCard
                        key={p.id}
                        provider={p}
                        showFavoriteButton={false}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </div>
  );
}

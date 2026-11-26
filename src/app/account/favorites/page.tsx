import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { checkProviderVisibility } from "@/lib/provider-visibility";
import { getBaseAppUrl } from "@/lib/seo";
import type { PublicProviderCardData } from "@/lib/marketplace-query";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import {
  FavoritesClient,
  type FavoriteGroup,
  type UnavailableFavorite,
} from "./favorites-client";

export const dynamic = "force-dynamic";

export default async function AccountFavoritesPage() {
  const session = await requireUser();
  const role = (session.user as { role?: string }).role;
  if (role !== "VISITOR") {
    redirect(role === "ADMIN" ? "/admin" : "/dashboard");
  }

  const [userRow, favoriteRows] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { favoritesShareToken: true },
    }),
    prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        providerId: true,
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
            status: true,
            createdAt: true,
            subscriptions: {
              where: { status: "ACTIVE" },
              select: { status: true, startsAt: true, endsAt: true },
            },
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
    }),
  ]);

  const groupsMap = new Map<string, FavoriteGroup>();
  const unavailable: UnavailableFavorite[] = [];

  for (const fav of favoriteRows) {
    const p = fav.provider;
    if (!checkProviderVisibility(p).isVisible) {
      unavailable.push({ providerId: p.id, name: p.name });
      continue;
    }

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
    const existingGroup = groupsMap.get(groupId);
    if (existingGroup) {
      existingGroup.providers.push(card);
    } else {
      groupsMap.set(groupId, {
        categoryId: groupId,
        categoryName: groupName,
        providers: [card],
      });
    }
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <PublicHeader />
      <Section spacing="sm">
        <Container className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="SAVED PROVIDERS"
              title="المفضلة"
              description="مقدمو الخدمات الذين قمتِ بحفظهم مرتبين حسب الفئة."
            />
            <Button asChild variant="secondary" size="sm">
              <Link href="/account">العودة لحسابي</Link>
            </Button>
          </div>

          <FavoritesClient
            groups={Array.from(groupsMap.values())}
            unavailable={unavailable}
            initialShareToken={userRow?.favoritesShareToken ?? null}
            baseUrl={getBaseAppUrl()}
          />
        </Container>
      </Section>
    </div>
  );
}

import { getProviderLimits } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderPage } from "@/lib/provider-dashboard";
import { OffersClient } from "./offers-client";

export const dynamic = "force-dynamic";

export default async function DashboardOffersPage() {
  const { provider } = await requireOwnedProviderPage();

  const offers = await prisma.offer.findMany({
    where: { providerId: provider.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      isActive: true,
      sortOrder: true,
    },
  });

  const limits = getProviderLimits(provider);

  return (
    <OffersClient
      offers={offers}
      limit={limits.offers}
      isSuspended={provider.status === "SUSPENDED"}
    />
  );
}


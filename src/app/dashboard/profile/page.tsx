import { prisma } from "@/lib/prisma";
import { requireOwnedProviderPage } from "@/lib/provider-dashboard";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const { provider } = await requireOwnedProviderPage();

  const [providerCategories, categories] = await Promise.all([
    prisma.providerCategory.findMany({
      where: { providerId: provider.id },
      select: { categoryId: true, isPrimary: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
      select: { id: true, nameAr: true },
    }),
  ]);

  const categoryIds = providerCategories.map((pc) => pc.categoryId);
  const primaryCategoryId =
    providerCategories.find((pc) => pc.isPrimary)?.categoryId ??
    categoryIds[0] ??
    "";

  return (
    <ProfileClient
      isSuspended={provider.status === "SUSPENDED"}
      cloudName={process.env.CLOUDINARY_CLOUD_NAME ?? ""}
      categories={categories}
      provider={{
        slug: provider.slug,
        name: provider.name,
        bio: provider.bio ?? "",
        district: provider.district,
        address: provider.address ?? "",
        phone: provider.phone ?? "",
        whatsapp: provider.whatsapp ?? "",
        instagramUrl: provider.instagramUrl ?? "",
        facebookUrl: provider.facebookUrl ?? "",
        logoUrl: provider.logoUrl,
        logoPublicId: provider.logoPublicId,
        coverUrl: provider.coverUrl,
        coverPublicId: provider.coverPublicId,
        categoryIds,
        primaryCategoryId,
      }}
    />
  );
}


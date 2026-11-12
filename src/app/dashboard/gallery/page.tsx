import { getProviderLimits } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderPage } from "@/lib/provider-dashboard";
import { GalleryClient } from "./gallery-client";

export const dynamic = "force-dynamic";

export default async function DashboardGalleryPage() {
  const { provider } = await requireOwnedProviderPage();

  const media = await prisma.media.findMany({
    where: { providerId: provider.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      type: true,
      url: true,
      cloudinaryPublicId: true,
      caption: true,
      sortOrder: true,
    },
  });

  const images = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");
  const limits = getProviderLimits(provider);

  return (
    <GalleryClient
      images={images}
      videos={videos}
      imageLimit={limits.images}
      videoLimit={limits.videos}
      cloudName={process.env.CLOUDINARY_CLOUD_NAME ?? ""}
      isSuspended={provider.status === "SUSPENDED"}
    />
  );
}


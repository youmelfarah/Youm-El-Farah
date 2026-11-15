import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "@/lib/provider-visibility";
import { getBaseAppUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseAppUrl();

  // 1. Static public routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/join`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. Active categories with at least one visible provider
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
      providers: {
        some: {
          provider: visibleProviderWhere(),
        },
      },
    },
    select: { slug: true },
  });

  for (const cat of categories) {
    routes.push({
      url: `${baseUrl}/services/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // 3. All currently visible providers
  const providers = await prisma.provider.findMany({
    where: visibleProviderWhere(),
    select: { slug: true, updatedAt: true },
  });

  for (const prov of providers) {
    routes.push({
      url: `${baseUrl}/providers/${prov.slug}`,
      lastModified: prov.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return routes;
}

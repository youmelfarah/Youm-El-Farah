import type { MetadataRoute } from "next";
import { getBaseAppUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/account", "/api", "/styleguide"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

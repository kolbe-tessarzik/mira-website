import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return [
    {
      url: `https://mira.fatalmistake02.com/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `https://mira.fatalmistake02.com/downloads`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}

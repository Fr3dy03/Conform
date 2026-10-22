import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteOrigin(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteOrigin()}/console`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

import type { MetadataRoute } from "next";

function origin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
      .origin;
  } catch {
    return "http://localhost:3000";
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: origin(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${origin()}/console`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

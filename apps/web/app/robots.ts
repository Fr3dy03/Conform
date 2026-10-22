import type { MetadataRoute } from "next";

function origin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
      .origin;
  } catch {
    return "http://localhost:3000";
  }
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/report"],
    },
    sitemap: `${origin()}/sitemap.xml`,
  };
}

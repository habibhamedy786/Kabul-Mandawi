import type { MetadataRoute } from "next";

// Tells search engines what they may crawl, and where the sitemap lives.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/functional areas out of search results.
      disallow: ["/admin", "/dashboard", "/checkout", "/cart", "/reset-password", "/forgot-password"],
    },
    sitemap: "https://kabulmandawi.com/sitemap.xml",
  };
}

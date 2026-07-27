import type { MetadataRoute } from "next";

const base = "https://kabulmandawi.com";

// The main public pages, so Google can discover and index them.
const paths = [
  "",
  "/products",
  "/about",
  "/contact",
  "/faq",
  "/custom-request",
  "/refund-policy",
  "/terms",
  "/privacy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
}

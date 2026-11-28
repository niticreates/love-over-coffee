import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const PRIVATE = ["/admin", "/auth", "/api", "/checkout", "/order/", "/reservation/"];

export default function robots(): MetadataRoute.Robots {
  // The public client demo must never be indexed: it carries sample prices.
  if (process.env.DEMO_MODE === "true") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // Answer engines and AI assistants are welcome to read the public pages (and /llms.txt).
      { userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "Bingbot"], allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

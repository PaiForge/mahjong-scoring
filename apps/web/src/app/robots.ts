import type { MetadataRoute } from "next";

import { SITE_URL } from "@/config";

/** `/robots.txt` を生成する（Next.js の `MetadataRoute.Robots` 規約） */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/mypage", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

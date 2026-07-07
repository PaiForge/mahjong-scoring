import type { MetadataRoute } from "next";

import { getPublishedAnnouncementSlugsForSitemap } from "@/app/(user)/(public)/announcements/_lib/queries";
import { CURRICULUM_CHAPTER_SLUGS } from "@/app/(user)/(public)/learn/_lib/curriculum";
import { SITE_URL } from "@/config";
import { PRACTICE_MENU_SLUGS } from "@/lib/db/practice-menu-types";

const STATIC_ROUTE_DEFS = [
  { url: "", changeFrequency: "weekly", priority: 1.0 },
  { url: "/getting-started", changeFrequency: "monthly", priority: 0.9 },
  { url: "/learn", changeFrequency: "weekly", priority: 0.9 },
  { url: "/practice", changeFrequency: "weekly", priority: 0.9 },
  { url: "/reference", changeFrequency: "weekly", priority: 0.8 },
  { url: "/reference/score-table", changeFrequency: "monthly", priority: 0.7 },
  { url: "/reference/yaku", changeFrequency: "monthly", priority: 0.7 },
  { url: "/announcements", changeFrequency: "daily", priority: 0.5 },
  { url: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { url: "/privacy", changeFrequency: "yearly", priority: 0.2 },
] as const;

const STATIC_ROUTES: MetadataRoute.Sitemap = STATIC_ROUTE_DEFS.map((route) => ({
  ...route,
  url: `${SITE_URL}${route.url}`,
}));

const LEARN_ROUTES: MetadataRoute.Sitemap = CURRICULUM_CHAPTER_SLUGS.map(
  (slug) => ({
    url: `${SITE_URL}/learn/${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }),
);

const PRACTICE_ROUTES: MetadataRoute.Sitemap = PRACTICE_MENU_SLUGS.map(
  (slug) => ({
    url: `${SITE_URL}/practice/${slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }),
);

/** `/sitemap.xml` を生成する（Next.js の `MetadataRoute.Sitemap` 規約） */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const announcementSlugs = await getPublishedAnnouncementSlugsForSitemap();

  const announcementRoutes: MetadataRoute.Sitemap = announcementSlugs.map(
    ({ slug, publishedAt }) => ({
      url: `${SITE_URL}/announcements/${slug}`,
      lastModified: publishedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.4,
    }),
  );

  return [
    ...STATIC_ROUTES,
    ...LEARN_ROUTES,
    ...PRACTICE_ROUTES,
    ...announcementRoutes,
  ];
}

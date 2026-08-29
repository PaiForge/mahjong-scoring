import type { MetadataRoute } from "next";

import { getPublishedAnnouncementSlugsForSitemap } from "@/app/(user)/(public)/announcements/_lib/queries";
import {
  GLOSSARY_SITEMAP_PATHS,
  LEARN_SITEMAP_PATHS,
  PRACTICE_SITEMAP_PATHS,
  STATIC_SITEMAP_ROUTE_DEFS,
} from "@/app/_lib/sitemap-routes";
import { SITE_URL } from "@/config";

const STATIC_ROUTES: MetadataRoute.Sitemap = STATIC_SITEMAP_ROUTE_DEFS.map(
  (route) => ({
    ...route,
    url: `${SITE_URL}${route.url}`,
  }),
);

const LEARN_ROUTES: MetadataRoute.Sitemap = LEARN_SITEMAP_PATHS.map((path) => ({
  url: `${SITE_URL}${path}`,
  changeFrequency: "monthly",
  priority: 0.8,
}));

const PRACTICE_ROUTES: MetadataRoute.Sitemap = PRACTICE_SITEMAP_PATHS.map(
  (path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }),
);

const GLOSSARY_ROUTES: MetadataRoute.Sitemap = GLOSSARY_SITEMAP_PATHS.map(
  (path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority: 0.5,
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
    ...GLOSSARY_ROUTES,
    ...announcementRoutes,
  ];
}

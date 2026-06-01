import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getPublishedAnnouncementsPaginated } from "@/app/(user)/(public)/announcements/_lib/queries";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

const HOME_ANNOUNCEMENTS_LIMIT = 5;

export async function HomeAnnouncements() {
  const locale = await getLocale();
  const [t, announcements] = await Promise.all([
    getTranslations("announcements"),
    getPublishedAnnouncementsPaginated(locale, HOME_ANNOUNCEMENTS_LIMIT, 0),
  ]);

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>

      {announcements.length === 0 ? (
        <p className="mt-8 text-sm text-surface-500">{t("empty")}</p>
      ) : (
        <div className="mt-8">
          <ul className="divide-y divide-surface-200 border-y border-surface-200">
            {announcements.map((announcement) => {
              const publishedDate = announcement.publishedAt
                ? new Date(announcement.publishedAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : undefined;

              return (
                <li key={announcement.id}>
                  <Link
                    href={`/announcements/${announcement.slug}`}
                    className="flex items-center justify-between gap-4 px-1 py-4 transition-colors hover:bg-surface-50"
                  >
                    <span className="flex items-center gap-2 font-medium text-surface-900">
                      {announcement.pinnedAt !== null && (
                        <span className="rounded bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                          {t("pinned")}
                        </span>
                      )}
                      {announcement.title}
                    </span>
                    {publishedDate && (
                      <span className="shrink-0 text-sm text-surface-400">{publishedDate}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 text-right">
            <Link
              href="/announcements"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {t("viewAll")}
            </Link>
          </div>
        </div>
      )}
    </ContentContainer>
  );
}

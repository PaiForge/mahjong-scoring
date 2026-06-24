import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { getPublishedAnnouncementsPaginated } from "@/app/(user)/(public)/announcements/_lib/queries";
import { ContentContainer } from "@/app/_components/content-container";
import { ListLink, ListLinkContainer } from "@/app/_components/list-link";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";

const HOME_ANNOUNCEMENTS_LIMIT = 5;

export async function HomeAnnouncements() {
  const locale = await getLocale();
  const [t, tNav, announcements] = await Promise.all([
    getTranslations("announcements"),
    getTranslations("nav"),
    getPublishedAnnouncementsPaginated(locale, HOME_ANNOUNCEMENTS_LIMIT, 0),
  ]);

  return (
    <ContentContainer>
      <PageTitle>{tNav("home")}</PageTitle>

      <div className="space-y-4">
        <SectionTitle>{t("pageTitle")}</SectionTitle>

        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="space-y-4">
            <ListLinkContainer>
              {announcements.map((announcement) => {
                const publishedDate = announcement.publishedAt
                  ? new Date(announcement.publishedAt).toLocaleDateString(
                      locale,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : undefined;

                return (
                  <ListLink
                    key={announcement.id}
                    href={`/announcements/${announcement.slug}`}
                    icon="📢"
                    title={announcement.title}
                    meta={publishedDate}
                    badge={
                      announcement.pinnedAt !== null ? (
                        <span className="flex-shrink-0 rounded bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                          {t("pinned")}
                        </span>
                      ) : undefined
                    }
                  />
                );
              })}
            </ListLinkContainer>
            <div className="text-right">
              <Link
                href="/announcements"
                className="text-sm font-medium text-link-primary transition-colors hover:opacity-80"
              >
                {t("viewAll")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </ContentContainer>
  );
}

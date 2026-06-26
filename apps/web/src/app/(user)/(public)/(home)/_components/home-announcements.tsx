import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { AnnouncementListItem } from "@/app/(user)/(public)/announcements/_components/announcement-list-item";
import { getPublishedAnnouncementsPaginated } from "@/app/(user)/(public)/announcements/_lib/queries";
import { ContentContainer } from "@/app/_components/content-container";
import { ListLinkContainer } from "@/app/_components/list-link";
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
              {announcements.map((announcement) => (
                <AnnouncementListItem
                  key={announcement.id}
                  announcement={announcement}
                  locale={locale}
                  pinnedLabel={t("pinned")}
                />
              ))}
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

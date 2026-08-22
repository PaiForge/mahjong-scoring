import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { AnnouncementListItem } from "@/app/(user)/(public)/announcements/_components/announcement-list-item";
import { getPublishedAnnouncementsPaginated } from "@/app/(user)/(public)/announcements/_lib/queries";
import { ListLinkContainer } from "@/app/(user)/_components/list-link";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

const HOME_ANNOUNCEMENTS_LIMIT = 5;

/**
 * ダッシュボードのお知らせセクション。最新のお知らせを数件だけ載せる。
 * お知らせ（ダッシュボード）
 */
export async function HomeAnnouncements() {
  const locale = await getLocale();
  const [t, announcements] = await Promise.all([
    getTranslations("announcements"),
    getPublishedAnnouncementsPaginated(locale, HOME_ANNOUNCEMENTS_LIMIT, 0),
  ]);

  return (
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
              className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
            >
              {t("viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

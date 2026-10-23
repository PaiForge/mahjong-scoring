import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { HOME_ANNOUNCEMENTS_LIMIT } from "@mahjong-scoring/features/announcements/listing";
import { AnnouncementTextList } from "@/app/(user)/(public)/announcements/_components/announcement-text-list";
import { getPublishedAnnouncementsPaginated } from "@/lib/announcements/queries";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";

/**
 * ダッシュボードのお知らせセクション。最新のお知らせを数件だけ載せる。
 * お知らせ（ダッシュボード）
 *
 * 細枠と淡い区切りで更新をまとめ、日付とタイトルを読みやすく並べる。
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
          <AnnouncementTextList
            announcements={announcements}
            locale={locale}
            pinnedLabel={t("pinned")}
          />
          <div className="text-right">
            <Link
              href={ANNOUNCEMENTS_PATH}
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 hover:text-foreground ${FOCUS_RING_CLASSES}`}
            >
              {t("viewAll")}
              <span aria-hidden="true">
                <ChevronRightIcon />
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { AnnouncementTextList } from "@/app/(user)/(public)/announcements/_components/announcement-text-list";
import { getPublishedAnnouncementsPaginated } from "@/app/(user)/(public)/announcements/_lib/queries";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

/**
 * ダッシュボードに載せる件数。
 *
 * ここはお知らせの在庫を見せる場ではなく、更新に気づくための場なので、
 * 学習導線（教本の続き・おすすめの練習）より縦を食わない長さに抑える。
 * 全件は「すべて見る」から一覧ページへ。
 */
const HOME_ANNOUNCEMENTS_LIMIT = 3;

/**
 * ダッシュボードのお知らせセクション。最新のお知らせを数件だけ載せる。
 * お知らせ（ダッシュボード）
 *
 * 一覧ページと違いお知らせはこのページの主役ではないため、枠を持たない
 * `AnnouncementTextList` で出す。太枠 + 影のリストは「押して始める」練習
 * カードと同じ重さなので、読むだけのお知らせがそれを着ると、画面の重み付けが
 * 重要度の逆順になる。
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

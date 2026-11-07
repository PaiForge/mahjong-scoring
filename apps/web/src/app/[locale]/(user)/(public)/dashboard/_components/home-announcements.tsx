import { getTranslations } from "next-intl/server";

import { HOME_ANNOUNCEMENTS_LIMIT } from "@mahjong-scoring/features/announcements/listing";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { AnnouncementTextList } from "@/app/[locale]/(user)/(public)/announcements/_components/announcement-text-list";
import {
  getPublishedAnnouncementsExact,
  getPublishedAnnouncementsPaginated,
} from "@/lib/announcements/queries";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { LocaleNavLink } from "@/app/[locale]/(user)/_components/locale-nav-link";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { ChevronRightIcon } from "@/app/[locale]/(user)/_components/icons/chevron-right-icon";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { ANNOUNCEMENTS_PATH } from "@mahjong-scoring/features/routes";

import { linkLabel } from "./link-label";

interface HomeAnnouncementsProps {
  /** ページの言語（`prepareRouteLocale` が確定したもの） */
  readonly locale: SupportedLocale;
}

/**
 * ページの言語でダッシュボードに載せるお知らせを引く
 * ダッシュボードのお知らせ取得
 *
 * 日本語は従来どおり fallback 付きのクエリ（`getPublishedAnnouncementsPaginated`。
 * slug ごとに要求言語 → 日本語 → その他）。このクエリはアプリ向け API と
 * 日本語の一覧も使うので、意味を変えずにそのまま呼ぶ。
 *
 * 日本語以外は、その言語で書いて公開した行だけ（`getPublishedAnnouncementsExact`）。
 * fallback 付きのクエリを使うと英訳の無いお知らせが日本語のタイトルのまま英語の
 * ダッシュボードに並ぶ。英語の画面に出すお知らせは英訳して公開した行だけ、という
 * 方針のため。
 */
function fetchHomeAnnouncements(locale: SupportedLocale) {
  return locale === DEFAULT_LOCALE
    ? getPublishedAnnouncementsPaginated(locale, HOME_ANNOUNCEMENTS_LIMIT, 0)
    : getPublishedAnnouncementsExact(locale, HOME_ANNOUNCEMENTS_LIMIT, 0);
}

/**
 * ダッシュボードのお知らせセクション。最新のお知らせを数件だけ載せる。
 * お知らせ（ダッシュボード）
 *
 * 細枠と淡い区切りで更新をまとめ、日付とタイトルを読みやすく並べる。
 *
 * 言語ごとの出し方（{@link fetchHomeAnnouncements}）:
 *
 * - 日本語: 従来どおり。0 件なら見出しの下に「お知らせはありません」を出す
 * - 日本語以外: その言語の行だけを載せる。0 件なら節ごと出さない —
 *   英訳はまだ少なく、空の節と「ありません」が常に並ぶと、英語の利用者には
 *   出せる情報が無いのに場所だけを取る。「すべて見る」の行き先（`/announcements`）は
 *   英語で未公開なので、日本語の一覧へ素の `<a hrefLang="ja">` で張り、
 *   「日本語のみ」の印を添える（英語の存在しない URL を作らず、クライアント遷移で
 *   英語の文書に日本語の本文を載せない）
 */
export async function HomeAnnouncements({ locale }: HomeAnnouncementsProps) {
  const [t, tNav, announcements] = await Promise.all([
    getTranslations("announcements"),
    getTranslations("nav"),
    fetchHomeAnnouncements(locale),
  ]);

  if (announcements.length === 0 && locale !== DEFAULT_LOCALE) {
    return undefined;
  }

  const viewAll = resolveNavTargetFor(ANNOUNCEMENTS_PATH, locale);

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
            <LocaleNavLink
              navTarget={viewAll}
              linkKind="plain"
              className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-50 hover:text-foreground ${FOCUS_RING_CLASSES}`}
            >
              {linkLabel(t("viewAll"), viewAll, tNav("language.japaneseOnly"))}
              <span aria-hidden="true">
                <ChevronRightIcon />
              </span>
            </LocaleNavLink>
          </div>
        </div>
      )}
    </div>
  );
}

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/i18n/locales";

/**
 * 広告の文言（タイトル・説明）。ロケールごとに 1 行ずつ
 * `ad_creative_translations` に保存する。
 * 広告文言
 *
 * 既定ロケール（ja）のタイトルは必須で、他ロケールで空いた項目の穴埋め先に
 * なる。穴埋めは項目ごと — 英語のタイトルだけ書いて説明は日本語のまま、が
 * できるよう、保存された値はどちらも欠けうる（`Partial`）。
 */

/** 1 項目の文言。ロケールごとに高々 1 つ */
export type StoredCopy = Partial<Record<SupportedLocale, string>>;

/** 1 つの広告の文言 */
export interface CreativeCopy {
  readonly title: StoredCopy;
  readonly description: StoredCopy;
}

/** `ad_creative_translations` の 1 行（読み込み結果・書き込み予定の両方） */
export interface CreativeCopyRow {
  readonly creativeId: string;
  readonly locale: string;
  readonly title: string | null;
  readonly description: string | null;
}

/** 1 項目を `locale` で読む。無ければ既定ロケール、それも無ければ undefined */
function copyForLocale(
  copy: StoredCopy,
  locale: SupportedLocale,
): string | undefined {
  return copy[locale] || copy[DEFAULT_LOCALE] || undefined;
}

/**
 * 閲覧者のロケールで読む広告の文言
 * 広告文言解決
 *
 * タイトルは既定ロケールの行が必ず持つ（DB の CHECK と管理画面の検証）ため、
 * 欠けるのは壊れた行だけ。そのときは空文字を返し、描画側で落とさない。
 */
export function resolveCreativeCopy(
  copy: CreativeCopy,
  locale: SupportedLocale,
): { readonly title: string; readonly description: string | undefined } {
  return {
    title: copyForLocale(copy.title, locale) ?? "",
    description: copyForLocale(copy.description, locale),
  };
}

/**
 * 文言の行を広告ごとの文言にまとめる。対応をやめたロケールの行は
 * 読む手段が無いので読み飛ばす（エラーにしない）。
 */
export function copyFromTranslationRows(
  rows: readonly CreativeCopyRow[],
): Map<string, CreativeCopy> {
  const byCreative = new Map<
    string,
    { title: StoredCopy; description: StoredCopy }
  >();
  for (const row of rows) {
    if (!isSupportedLocale(row.locale)) continue;
    const copy = byCreative.get(row.creativeId) ?? {
      title: {},
      description: {},
    };
    if (row.title !== null) copy.title[row.locale] = row.title;
    if (row.description !== null) {
      copy.description[row.locale] = row.description;
    }
    byCreative.set(row.creativeId, copy);
  }
  return byCreative;
}

/**
 * 1 つの広告の文言を保存する行に分ける。何も書いていないロケールは行を
 * 作らない（何も上書きしない行は CHECK で禁じている）。
 */
export function copyToTranslationRows(
  creativeId: string,
  copy: CreativeCopy,
): CreativeCopyRow[] {
  return SUPPORTED_LOCALES.flatMap((locale) => {
    const title = copy.title[locale] ?? null;
    const description = copy.description[locale] ?? null;
    if (title === null && description === null) return [];
    return [{ creativeId, locale, title, description }];
  });
}

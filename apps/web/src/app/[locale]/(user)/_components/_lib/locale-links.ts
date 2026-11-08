/**
 * シェル（ヘッダー・ドロワー・タブバー・フッター）のリンクを今の言語に合わせる
 * ロケールリンク解決
 *
 * ナビゲーション項目の href は `@mahjong-scoring/features/routes` が返す
 * ロケール非依存のパス（`/practice` 等）で持つ。ここはそれを「今のページの言語で
 * 張るべき最終 href」と「言語切替の各選択肢」に変える。
 *
 * @design 公開状態はサーバーで引き、クライアントは表を読むだけ
 * 言語ごとの公開状態は `@/i18n/route-policy` が一元に持つが、あのモジュールは
 * 日本語の分類のために sitemap のルート（用語集・教本・段級位・料金の
 * レジストリ）を読み込む。ヘッダーやタブバーのクライアントコンポーネントが
 * 直接 import すると、全ページのクライアント JS にそれらが載る。そこで
 * サーバー側（`locale-link-table.ts`）が「英語で公開しているパス → 言語ごとの
 * 公開 href」の小さな表（{@link LocaleLinkTable}）を `resolvePublishedHref` で
 * 作って props で渡し、このモジュールは表を引いて文字列を組むだけにする
 * （公開状態の判定を二重に持たない）。
 *
 * 守っている制約:
 *
 * - **日本語のページのリンクは変えない。** 既定の言語ではナビゲーションの
 *   href をそのまま返す（被リンク・既存の挙動を 1 本も動かさない）
 * - **英語の存在しない URL を作らない。** 英語のページから英語で未公開の
 *   ページへのリンクは、`/en` を付けずに日本語の URL へ向け、呼び出し側が
 *   「日本語のみ」と明示する（{@link NavTarget.crossLocale}）か、置き場所に
 *   明示する余地が無ければ出さない
 * - **言語切替は `/ja` を経由しない。** 日本語は接頭辞なしの最終 URL へ直接
 *   向ける（`resolvePublishedHref` がそう返す）
 * - **切替リンクに引き継ぐ query は許可リストだけ。** 認証のトークンや
 *   メールアドレスが載る query を別言語の URL へ写さない
 */

import { splitHref, stripLocalePrefix } from "@/i18n/public-path";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * 英語で公開しているパス → 言語ごとの公開 href の表
 *
 * キーはロケール非依存のパス（query・hash を含まない）。値は
 * `resolvePublishedHref(path, locale)` の結果で、未公開の言語は持たない。
 * 表に無いパスは「日本語だけで公開している（または存在しない）」。
 * サーバーコンポーネントからクライアントへ props で渡すため、Map ではなく
 * 素のオブジェクトにしている。
 */
export type LocaleLinkTable = Readonly<
  Record<string, Readonly<Partial<Record<SupportedLocale, string>>>>
>;

/** シェルの部品がリンクを組むのに要るもの（今のページの言語と公開 href の表） */
export interface LocaleLinks {
  /** 今のページの言語（URL の接頭辞と一致する。辞書の言語でもある） */
  readonly locale: SupportedLocale;
  readonly table: LocaleLinkTable;
}

/** ナビゲーション項目 1 つの、今のページから張る先 */
export interface NavTarget {
  /** 最終 href（日本語は接頭辞なし、英語は `/en` 付き） */
  readonly href: string;
  /**
   * リンク先が今のページと別の言語か（英語のページから日本語だけのページへ）。
   * true のとき呼び出し側は「日本語のみ」と明示し、素の `<a hrefLang="ja">` で
   * 文書ごと読み込む（`<html lang>` と辞書は文書の読み込みでしか切り替わらない）
   */
  readonly crossLocale: boolean;
}

/**
 * ナビゲーション項目の href を、今のページの言語で張る先に変える
 * ナビゲーション先解決
 *
 * 既定の言語（日本語）では入力をそのまま返す。それ以外の言語では、その言語で
 * 公開しているページならその言語の href（query・hash は残す）、未公開なら
 * 日本語の href のまま `crossLocale: true` を返す。
 *
 * @param path - ロケール非依存の href（query・hash を含んでよい）
 * @param localeLinks - 今のページの言語と公開 href の表
 */
export function resolveNavTarget(
  path: string,
  { locale, table }: LocaleLinks,
): NavTarget {
  if (locale === DEFAULT_LOCALE) return { href: path, crossLocale: false };
  const { pathname, search, hash } = splitHref(path);
  const published = table[pathname]?.[locale];
  if (published === undefined) return { href: path, crossLocale: true };
  return { href: `${published}${search}${hash}`, crossLocale: false };
}

/**
 * 言語切替のリンクへ引き継ぐ query のキー（許可リスト）
 *
 * 練習のバリアント（`variant`）と、点数表の注目セル（`role`・`winType`・
 * `han`・`fu`）。言語を変えても同じ表・同じ土俵を見続けられるように残す。
 * ここに無いキー（パスワード再設定の `code`、確認メールの `email` 等）は
 * 落とす — 別言語の URL へ認証の値を写さないため。英語で公開するページが
 * 増えて、そのページの意味を決める query があればここに足す（足し忘れても
 * 言語を変えたときに既定の表示へ戻るだけで、値が漏れる側には倒れない）。
 */
const PRESERVED_QUERY_KEYS: ReadonlySet<string> = new Set([
  "variant",
  "role",
  "winType",
  "han",
  "fu",
]);

/**
 * 言語切替のリンクへ引き継ぐ query を取り出す
 * 引き継ぎクエリ
 *
 * @param search - 今の URL の query（`?` 付きでも無しでもよい）
 * @returns 許可リストのキーだけを残した query（`?` 付き。残らなければ空文字）
 */
export function preservedSearch(search: string): string {
  const kept = new URLSearchParams();
  for (const [key, value] of new URLSearchParams(search)) {
    if (PRESERVED_QUERY_KEYS.has(key)) kept.append(key, value);
  }
  const query = kept.toString();
  return query === "" ? "" : `?${query}`;
}

/** 言語切替の選択肢 1 つ */
export type LanguageOption =
  /** 今のページの言語（リンクにしない） */
  | { readonly kind: "current"; readonly locale: SupportedLocale }
  /** 対訳のページがある言語（その対訳への href） */
  | {
      readonly kind: "link";
      readonly locale: SupportedLocale;
      readonly href: string;
    }
  /** このページの対訳が無い言語（リンクにせず、無いことを示す） */
  | { readonly kind: "unavailable"; readonly locale: SupportedLocale };

/**
 * 今のページから選べる言語の一覧を作る
 * 言語選択肢
 *
 * 並びは対応言語の定義順（日本語 → English）で、ページによって入れ替えない
 * （常設の部品の幅と並びを一定に保つ）。対訳の無い言語は `unavailable` で、
 * 別の言語の入口や LP へ勝手に向けない。
 *
 * @param pathname - `usePathname()` の値（ロケール接頭辞が付いていてもよい）
 * @param search - 今の URL の query（{@link preservedSearch} で絞ってから付ける）
 * @param localeLinks - 今のページの言語と公開 href の表
 */
export function languageOptions(
  pathname: string,
  search: string,
  { locale, table }: LocaleLinks,
): readonly LanguageOption[] {
  const path = stripLocalePrefix(pathname);
  const query = preservedSearch(search);
  return SUPPORTED_LOCALES.map((candidate): LanguageOption => {
    if (candidate === locale) return { kind: "current", locale: candidate };
    const href = table[path]?.[candidate];
    if (href === undefined) return { kind: "unavailable", locale: candidate };
    return { kind: "link", locale: candidate, href: `${href}${query}` };
  });
}

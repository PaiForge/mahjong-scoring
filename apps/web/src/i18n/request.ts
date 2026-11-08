import { getRequestConfig } from "next-intl/server";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

/**
 * ある言語のリクエストで読む辞書の型
 *
 * 日本語は全名前空間、英語は完訳の名前空間だけ（`@mahjong-scoring/messages/en`）。
 * 2 つを混ぜた型（英語に日本語を足したもの）は作らない。
 */
export type MessagesForLocale = typeof jaMessages | typeof enMessages;

const MESSAGES_BY_LOCALE = {
  ja: jaMessages,
  en: enMessages,
} as const satisfies Readonly<Record<SupportedLocale, MessagesForLocale>>;

/**
 * 言語の辞書を 1 つだけ返す
 * 辞書読み込み
 *
 * 日本語へ fallback しない。英語の辞書には未訳の名前空間が無く、未訳のキーを
 * 引くと画面に辞書キーが出る。それを日本語で埋めると、英語の URL に日本語の
 * 本文が 200 で出る（索引される）ため。未訳の英語ページは描画の前に
 * `prepareRouteLocale`（`route-policy.ts` の許可リスト）が 404 にし、英語で
 * 公開するルートが読む名前空間が完訳であることは `publication-gate.test.ts` が
 * 検査する。
 *
 * @param locale - 検証済みのロケール
 */
export function loadMessages(
  locale: SupportedLocale,
): Promise<MessagesForLocale> {
  return Promise.resolve(MESSAGES_BY_LOCALE[locale]);
}

/**
 * next-intl のリクエスト設定
 *
 * 辞書は `@mahjong-scoring/messages`（モバイルと共有）が持つ。ロケールは
 * `requestLocale` から決める。`app/[locale]` のページ・レイアウトは描画の前に
 * `setRequestLocale` で確定させる（`prepareRouteLocale`）ので、ここで headers を
 * 読みに行かず静的生成が保たれる。
 *
 * `requestLocale` が対応ロケールでないとき（undefined を含む）は日本語にする。
 * これは `app/[locale]` の外 — 管理画面・API・認証コールバック・言語ヘッダの無い
 * Server Action — で、どれも日本語固定の画面・処理だから。`app/[locale]` の中の
 * 不正なロケールは、ここに来る前にページ・レイアウトが 404 にする。辞書の
 * fallback（英語に日本語を混ぜる）とは別物で、選んだ言語の辞書は {@link loadMessages}
 * が 1 つだけ返す。
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested !== undefined && isSupportedLocale(requested)
      ? requested
      : DEFAULT_LOCALE;
  return { locale, messages: await loadMessages(locale) };
});

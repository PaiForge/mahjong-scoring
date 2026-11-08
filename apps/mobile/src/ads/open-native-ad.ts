import { Linking } from "react-native";
import type { Messages } from "use-intl";
import { APP_MESSAGES } from "../lib/app-locale";

/**
 * 広告のリンクを OS に開かせる
 * 広告リンクを開く
 *
 * アプリ内ブラウザ（`expo-web-browser`）ではなく `Linking.openURL` で開く。
 * Amazon の商品ページは Amazon アプリが自分のリンクとして登録しているため、
 * 入っていれば（多くの人がログイン済みの）Amazon アプリが開き、無ければ
 * 標準のブラウザが開く。iOS のアプリ内ブラウザは Safari と Cookie を共有せず
 * Amazon が未ログインで開くため、購入まで進みにくい。開けるアプリが無ければ
 * 何もしない。
 */
export function openNativeAd(href: string): void {
  Linking.openURL(href).catch(() => {
    // 開けるアプリが無い。押しても何も起きないだけでよい
  });
}

/**
 * アプリの言語の一覧の区切り（辞書の `common.listSeparator`。日本語は `、`、英語は `, `）
 *
 * 読み上げの名前を組む {@link nativeAdAccessibilityLabel} はフックではない関数で、
 * 辞書の Provider の外からも呼べる形にしてあるため、`useAppLocale()` /
 * `useTranslations()` ではなく、Provider と同じ起動時に決めた辞書（`APP_MESSAGES`。
 * `APP_LOCALE` の辞書）から直接引く。言語は起動中に変わらないので、モジュールの
 * 評価時に 1 回読めば足りる。呼び出し側（`native-ad-row.tsx` / `native-ad-card.tsx`）は
 * 区切りを渡さずこの既定値に任せる。
 *
 * 辞書の型は `Record<string, any>` なので文字列であることを確かめて読む。キーは ja / en の
 * どちらの辞書にもあり（辞書のテストが形の一致を固定する）、無ければ辞書の誤りなので
 * 黙って別の区切りに落とさず投げる。
 */
const DEFAULT_LIST_SEPARATOR: string = readListSeparator(APP_MESSAGES);

function readListSeparator(messages: Messages): string {
  const separator: unknown = messages.common?.listSeparator;
  if (typeof separator !== "string") {
    throw new Error("辞書に common.listSeparator（文字列）がありません");
  }
  return separator;
}

/**
 * 広告の読み上げの名前。カードも行も 1 つの読み上げ単位になり、中の「PR」は
 * 「ピーアール」と読まれるだけになるため、広告であることを先頭で言う
 * 広告読み上げ名
 *
 * 区切りは言語に依る（日本語は `、`、英語は `, `。辞書の `common.listSeparator`）。
 * この関数はフックの外から呼べるよう区切りを引数で受け、省略時はアプリの言語の区切り。
 * 説明の無い広告は区切りを重ねない。
 *
 * @param badgeLabel - 広告の印（「PR」）
 * @param ad - 広告の題名と説明
 * @param separator - 読み上げの区切り（省略時はアプリの言語の `common.listSeparator`）
 */
export function nativeAdAccessibilityLabel(
  badgeLabel: string,
  ad: { readonly title: string; readonly description: string | undefined },
  separator: string = DEFAULT_LIST_SEPARATOR,
): string {
  return [badgeLabel, ad.title, ad.description]
    .filter((part) => part !== undefined)
    .join(separator);
}

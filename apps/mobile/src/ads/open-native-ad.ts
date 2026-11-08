import { Linking } from "react-native";

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
 * 日本語の一覧の区切り（辞書の `common.listSeparator` の ja と同じ値）
 *
 * TODO(T2→統合): アプリの言語の解決（`lib/app-locale.ts` の `APP_LOCALE` /
 * `APP_MESSAGES`）が入ったら、既定値をアプリの言語の `common.listSeparator`
 * （ja `、` / en `, `）に替える。呼び出し側（`native-ad-row.tsx` /
 * `native-ad-card.tsx`）はフックで区切りを引かずにこの既定値に任せる。
 */
const DEFAULT_LIST_SEPARATOR = "、";

/**
 * 広告の読み上げの名前。カードも行も 1 つの読み上げ単位になり、中の「PR」は
 * 「ピーアール」と読まれるだけになるため、広告であることを先頭で言う
 * 広告読み上げ名
 *
 * 区切りは言語に依る（日本語は `、`、英語は `, `。辞書の `common.listSeparator`）。
 * この関数はフックの外から呼べるよう区切りを引数で受け、省略時は既定の区切り。
 * 説明の無い広告は区切りを重ねない。
 *
 * @param badgeLabel - 広告の印（「PR」）
 * @param ad - 広告の題名と説明
 * @param separator - 読み上げの区切り（省略時は既定の区切り）
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

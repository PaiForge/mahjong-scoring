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
 * 広告の読み上げの名前。カードも行も 1 つの読み上げ単位になり、中の「PR」は
 * 「ピーアール」と読まれるだけになるため、広告であることを先頭で言う
 * 広告読み上げ名
 */
export function nativeAdAccessibilityLabel(
  badgeLabel: string,
  ad: { readonly title: string; readonly description: string | undefined },
): string {
  return [badgeLabel, ad.title, ad.description]
    .filter((part) => part !== undefined)
    .join("、");
}

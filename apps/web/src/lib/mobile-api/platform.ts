import {
  APP_PLATFORM_HEADER,
  isMobileAppPlatform,
  type MobileAppPlatform,
} from "@mahjong-scoring/features/app-version/mobile-api";

/**
 * 要求したアプリの OS（ストアの経路）を読む
 * 要求元プラットフォーム判定
 *
 * クエリの `platform` → ヘッダ `X-App-Platform` の順に読み、どちらも無い・知らない
 * 値なら `ios`。公開の販売中商品の API（`GET /plan/offers`）はクエリで、ログイン
 * 付きのプランの API（`GET /plan`）はヘッダで受ける。
 *
 * 無指定を `ios` に倒すのは、ストアに出ている iOS 1.0.0 が公開の要求に何も付けず、
 * ログイン付きの要求にだけヘッダを付けるため — 無指定を `ios` とすれば、既存の版が
 * 受ける応答は変わらない。公開の要求にヘッダを足す案は採らない: 公開の要求の
 * 読み出し（アプリの `readPublicMobileApi`）は広告の API とも共用で、ヘッダを
 * 足すと画面確認用の web 版でプリフライトが変わる。クエリで OS を渡すのは
 * 最低バージョンの API（`app-version?platform=`）に前例がある。
 *
 * この値は要求した側の申告で、偽れる。**この値で回数制限や権利（特典・記録の
 * 可否）を変えない。** 使ってよいのは、誰が読んでも害の無い販売中の商品の
 * 出し分けだけ（`android` と名乗っても、見えるのは Google Play の公開の
 * Product ID だけ）。
 *
 * @param request - アプリ向け API の要求
 */
export function mobilePlatformOf(request: Request): MobileAppPlatform {
  const query = new URL(request.url).searchParams.get("platform");
  if (isMobileAppPlatform(query)) return query;
  const header = request.headers.get(APP_PLATFORM_HEADER);
  if (isMobileAppPlatform(header)) return header;
  return "ios";
}

import { z } from "zod";

/**
 * アプリの最低バージョンの API の契約（パス・応答・ヘッダ）
 *
 * ストアに出た版のアプリは手元で直せないので、サーバーと噛み合わなくなった
 * 版を止める手段をここに持つ。アプリは起動時と前面に戻ったときにこの API を
 * 読み、自分の版が `minimumVersion` を下回ればアップデートの案内だけを出す。
 * 誰が読んでも同じ値なのでログインを要らない。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * アプリの OS。最低バージョンは OS ごとに持つ（ストアの審査が別々に進むため）
 * アプリプラットフォーム
 */
export const MOBILE_APP_PLATFORMS = ["ios", "android"] as const;

/** アプリの OS（{@link MOBILE_APP_PLATFORMS}） */
export type MobileAppPlatform = (typeof MOBILE_APP_PLATFORMS)[number];

/** 値がアプリの OS か */
export function isMobileAppPlatform(
  value: unknown,
): value is MobileAppPlatform {
  return MOBILE_APP_PLATFORMS.some((platform) => platform === value);
}

/**
 * 最低バージョンを返す API のパス（GET。`?platform=` で OS を指定する）
 * 最低バージョンAPIパス
 */
export const MOBILE_APP_VERSION_API_PATH = `${MOBILE_API_PREFIX}/app-version`;

/**
 * 最低バージョンの API の URL（パス + クエリ）
 * 最低バージョンAPI URL
 */
export function mobileAppVersionApiUrl(platform: MobileAppPlatform): string {
  return `${MOBILE_APP_VERSION_API_PATH}?platform=${platform}`;
}

/**
 * アプリが自分の版を知らせるヘッダ
 * アプリバージョンヘッダ
 *
 * ログインを要るアプリ向け API の要求すべてに付ける。今はサーバーが読まないが、
 * 応答の形を版で分ける必要が出たときに、すでに出ている版を見分けられるように
 * 最初の版から送っておく。
 */
export const APP_VERSION_HEADER = "X-App-Version";

/** アプリが自分の OS を知らせるヘッダ（値は {@link MobileAppPlatform}） */
export const APP_PLATFORM_HEADER = "X-App-Platform";

/**
 * 最低バージョンの応答
 * 最低バージョン応答
 *
 * 項目を足すときは省略可能にする — ストアに出ている版のアプリが古い形のまま読む。
 */
export interface MobileAppVersionResponse {
  /** これを下回る版は使えない（`1.0.0` の形）。無ければ止めない */
  readonly minimumVersion?: string;
}

const appVersionSchema = z.object({
  minimumVersion: z.string().optional(),
});

/**
 * 最低バージョンの応答を検証する。形が違えば undefined
 * 最低バージョン応答検証
 */
export function parseMobileAppVersionResponse(
  body: unknown,
): MobileAppVersionResponse | undefined {
  const parsed = appVersionSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

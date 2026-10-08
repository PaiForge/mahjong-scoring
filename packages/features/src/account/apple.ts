import { z } from "zod";

/**
 * アプリの Bundle ID。iOS のネイティブの Apple ログインで Apple が ID トークンの
 * `aud` に入れる値で、サーバーが Apple と認可コードを交換・取り消しするときの
 * `client_id` にもなる
 * アプリBundle ID
 *
 * `apps/mobile/app.json` の `ios.bundleIdentifier` と同じ値（アプリのテストが
 * 突き合わせる）。Supabase の Apple の設定（Client IDs）にも同じ値を入れる。
 */
export const APPLE_APP_BUNDLE_ID = "help.mahjong.score";

/**
 * Apple でログインした直後に、Apple の認可コードを預ける API のパス（POST）
 * Apple認可コードAPIパス
 *
 * サーバーは受け取ったコードを Apple と交換して refresh token を保存し、
 * 退会のときに Apple 側の連携の取り消しに使う。
 */
export const MOBILE_APPLE_TOKEN_API_PATH = "/api/mobile/v1/apple/token";

/** Apple の認可コードを預ける要求 */
export interface MobileAppleTokenRequest {
  readonly authorizationCode: string;
}

/**
 * 認可コードを預ける API が返す、固有の失敗の理由
 *
 * - `invalidRequest` — 要求の形が違う（400）
 * - `appleRejected` — Apple がコードを受け付けなかった、または交換の結果が
 *   ログイン中のユーザーの Apple の連携と一致しない（422）。送り直しても通らない
 * - `appleUnavailable` — Apple に届かなかった・サーバーに Apple の設定が無い（503）
 */
export type MobileAppleTokenErrorCode =
  "invalidRequest" | "appleRejected" | "appleUnavailable";

/** 認可コードを預ける要求の検証（サーバー用） */
export const mobileAppleTokenRequestSchema = z.object({
  authorizationCode: z.string().min(1).max(1024),
});

/**
 * アプリ向け API のパスの接頭辞（サイトの origin からの相対）
 * アプリAPI接頭辞
 *
 * 版を URL に持つのは、配布済みのアプリを強制的に更新できないため。
 * 応答の形を壊す変更は `v2` を足して並べ、古い版のアプリが読む `v1` を
 * 使われなくなるまで残す。
 */
const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * ログイン中のアカウントの状態を返す API のパス
 * アカウント状態APIパス
 */
export const MOBILE_ME_API_PATH = `${MOBILE_API_PREFIX}/me`;

/**
 * ログイン中のアカウントの状態
 * アカウント状態応答
 *
 * アプリは起動時とログイン直後にこれを読み、`profile` が null なら
 * ユーザー名の設定へ送る（web の `/mypage/setup-username` と同じ段階）。
 */
export interface MobileMeResponse {
  readonly userId: string;
  /** プロフィール。ユーザー名を決める前は null */
  readonly profile: { readonly username: string } | null;
}

/**
 * アプリ向け API が返すエラーの理由
 *
 * - `unauthorized` — トークンが無い・無効・失効（401）。ログアウト状態へ戻す
 * - `deleted` — 退会済み（401）。ログアウト状態へ戻す
 * - `banned` — BAN 済み（403）
 * - `rateLimited` — 回数の上限（429）
 */
export type MobileApiErrorCode =
  "unauthorized" | "deleted" | "banned" | "rateLimited";

/**
 * ユーザー名を決めてプロフィールを作る API のパス（POST）
 * ユーザー名登録APIパス
 */
export const MOBILE_USERNAME_API_PATH = `${MOBILE_API_PREFIX}/username`;

/** ユーザー名登録の要求 */
export interface MobileRegisterUsernameRequest {
  readonly username: string;
  /** 表示名。省略・空ならユーザー名を流用する */
  readonly displayName?: string;
}

/**
 * ユーザー名登録で弾く理由（422）。辞書の `setupUsername.validation` の
 * キーへの対応はアプリ側が持つ
 */
export type MobileUsernameErrorCode =
  | "too_short"
  | "too_long"
  | "invalid_format"
  | "reserved"
  | "username_required"
  | "username_already_set"
  | "username_taken"
  | "display_name_too_long";

/**
 * 退会の API のパス（POST）
 * 退会APIパス
 *
 * 途中で失敗しても、同じ要求をもう一度送れば最初からやり直せる。
 */
export const MOBILE_DELETE_ACCOUNT_API_PATH = `${MOBILE_API_PREFIX}/account/delete`;

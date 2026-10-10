import { z } from "zod";

import {
  PROFILE_VALIDATION_ERRORS,
  type ProfileInput,
  type ProfileValidationError,
} from "./validation";

/**
 * アプリ向けのプロフィール編集の API の契約（パス・応答）
 *
 * 認証とエラーの理由（`unauthorized` 等）は `account/mobile-api.ts`、
 * ユーザー名を決める前の 409 `usernameRequired` は `mypage/mobile-api.ts` と共通。
 * ここにはプロフィール編集に固有のものだけを置く。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * プロフィールを読む（GET）・書く（POST）API のパス
 * プロフィールAPIパス
 *
 * POST の本文は {@link ProfileInput}（web のフォームと同じ形。空欄は空文字）。
 * 成功なら `{ success: true }`、入力の誤りは 422 で
 * {@link MobileProfileErrorCode} を返す。
 */
export const MOBILE_PROFILE_API_PATH = `${MOBILE_API_PREFIX}/profile`;

/**
 * プロフィール編集の材料（GET の応答）
 * プロフィール応答
 *
 * 編集する欄は web のフォームの初期値と同じく、未設定なら空文字。
 * 項目を足すときは省略可能にする — ストアに出ている版のアプリが古い形のまま読む。
 */
export interface MobileProfileResponse extends ProfileInput {
  readonly username: string;
  /** アバター画像の URL。未設定なら無い */
  readonly avatarUrl?: string;
}

/**
 * プロフィールの保存の失敗の理由（422）
 *
 * 検証の誤り（`validation.ts` の {@link PROFILE_VALIDATION_ERRORS}）をそのまま返す。
 */
export type MobileProfileErrorCode = ProfileValidationError;

const profileErrorCodeSet: ReadonlySet<string> = new Set(
  PROFILE_VALIDATION_ERRORS,
);

/** 値がプロフィールの保存の失敗の理由かを判定する型ガード */
export function isMobileProfileErrorCode(
  value: unknown,
): value is MobileProfileErrorCode {
  return typeof value === "string" && profileErrorCodeSet.has(value);
}

const profileSchema = z.object({
  username: z.string(),
  displayName: z.string(),
  bio: z.string(),
  xUsername: z.string(),
  instagramUsername: z.string(),
  youtubeHandle: z.string(),
  avatarUrl: z.string().optional(),
});

/**
 * プロフィール編集の材料を検証する。形が違えば undefined
 * プロフィール応答検証
 */
export function parseMobileProfileResponse(
  body: unknown,
): MobileProfileResponse | undefined {
  const parsed = profileSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

/**
 * アバター画像を上げる API のパス（POST）
 * アバターアップロードAPIパス
 *
 * 本文は multipart で、`file` フィールドに JPEG / PNG / WebP を 1 枚（5MB まで）。
 * サーバーが 256px の正方形の WebP に正規化して保存する。成功なら
 * {@link MobileAvatarResponse}、受け付けない画像は 422 で
 * {@link MobileAvatarErrorCode} を返す。
 */
export const MOBILE_PROFILE_AVATAR_API_PATH = `${MOBILE_PROFILE_API_PATH}/avatar`;

/**
 * アバター画像を消す API のパス（POST）
 * アバター削除APIパス
 *
 * DELETE にしない — アプリ向け API はすべて GET / POST にそろえている
 * （退会の `account/delete` と同じ）。成功なら `{ success: true }`。
 */
export const MOBILE_PROFILE_AVATAR_DELETE_API_PATH = `${MOBILE_PROFILE_AVATAR_API_PATH}/delete`;

/**
 * アバター画像の保存の失敗の理由（422）
 *
 * - `invalidType` — 受け付けない形式（中身が申告の形式と違うものを含む）
 * - `tooLarge` — 5MB を超える
 * - `invalidImage` — 画像として読めない
 */
export const MOBILE_AVATAR_ERROR_CODES = [
  "invalidType",
  "tooLarge",
  "invalidImage",
] as const;

/** アバター画像の保存の失敗の理由（{@link MOBILE_AVATAR_ERROR_CODES}） */
export type MobileAvatarErrorCode = (typeof MOBILE_AVATAR_ERROR_CODES)[number];

const avatarErrorCodeSet: ReadonlySet<string> = new Set(
  MOBILE_AVATAR_ERROR_CODES,
);

/** 値がアバター画像の保存の失敗の理由かを判定する型ガード */
export function isMobileAvatarErrorCode(
  value: unknown,
): value is MobileAvatarErrorCode {
  return typeof value === "string" && avatarErrorCodeSet.has(value);
}

/**
 * アバター画像を上げた結果
 * アバターアップロード応答
 */
export interface MobileAvatarResponse {
  /** 保存した画像の URL（キャッシュバスト付き。上げるたびに変わる） */
  readonly avatarUrl: string;
}

const avatarSchema = z.object({ avatarUrl: z.string() });

/**
 * アバター画像を上げた結果を検証する。形が違えば undefined
 * アバターアップロード応答検証
 */
export function parseMobileAvatarResponse(
  body: unknown,
): MobileAvatarResponse | undefined {
  const parsed = avatarSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

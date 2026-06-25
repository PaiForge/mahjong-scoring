/**
 * プロフィール（表示名・自己紹介・SNS）の正規化＋バリデーション。
 * client（即時フィードバック）と server action（信頼境界）の両方で使う。
 * プロフィールバリデーション
 */

/** 各フィールドの最大長 */
export const PROFILE_LIMITS = {
  displayName: 50,
  bio: 500,
  xUsername: 15,
  instagramUsername: 30,
  youtubeHandle: 30,
} as const;

const X_USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const INSTAGRAM_USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;
const YOUTUBE_HANDLE_PATTERN = /^[a-zA-Z0-9._-]+$/;

/** フォームからの生入力（すべて文字列） */
export interface ProfileInput {
  readonly displayName: string;
  readonly bio: string;
  readonly xUsername: string;
  readonly instagramUsername: string;
  readonly youtubeHandle: string;
}

/** DB 保存用に正規化した値（空文字は null） */
export interface NormalizedProfile {
  readonly displayName: string | null;
  readonly bio: string | null;
  readonly xUsername: string | null;
  readonly instagramUsername: string | null;
  readonly youtubeHandle: string | null;
}

/** i18n キー（profileEdit 名前空間）と対応するバリデーションエラー */
export type ProfileValidationError =
  | "displayNameTooLong"
  | "bioTooLong"
  | "xUsernameInvalid"
  | "instagramUsernameInvalid"
  | "youtubeHandleInvalid";

export type ProfileValidationResult =
  | { readonly ok: true; readonly value: NormalizedProfile }
  | { readonly ok: false; readonly error: ProfileValidationError };

/** 先頭の @ を除去してトリムする（SNS ハンドルの正規化） */
function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@+/, "");
}

/**
 * 入力を正規化し、長さ・形式を検証する。
 * 空欄は省略可（null）として扱う。
 */
export function normalizeAndValidateProfile(
  input: ProfileInput,
): ProfileValidationResult {
  const displayName = input.displayName.trim();
  if (displayName.length > PROFILE_LIMITS.displayName) {
    return { ok: false, error: "displayNameTooLong" };
  }

  const bio = input.bio.trim();
  if (bio.length > PROFILE_LIMITS.bio) {
    return { ok: false, error: "bioTooLong" };
  }

  const xUsername = normalizeHandle(input.xUsername);
  if (
    xUsername &&
    (xUsername.length > PROFILE_LIMITS.xUsername ||
      !X_USERNAME_PATTERN.test(xUsername))
  ) {
    return { ok: false, error: "xUsernameInvalid" };
  }

  const instagramUsername = normalizeHandle(input.instagramUsername);
  if (
    instagramUsername &&
    (instagramUsername.length > PROFILE_LIMITS.instagramUsername ||
      !INSTAGRAM_USERNAME_PATTERN.test(instagramUsername))
  ) {
    return { ok: false, error: "instagramUsernameInvalid" };
  }

  const youtubeHandle = normalizeHandle(input.youtubeHandle);
  if (
    youtubeHandle &&
    (youtubeHandle.length > PROFILE_LIMITS.youtubeHandle ||
      !YOUTUBE_HANDLE_PATTERN.test(youtubeHandle))
  ) {
    return { ok: false, error: "youtubeHandleInvalid" };
  }

  return {
    ok: true,
    value: {
      displayName: displayName || null,
      bio: bio || null,
      xUsername: xUsername || null,
      instagramUsername: instagramUsername || null,
      youtubeHandle: youtubeHandle || null,
    },
  };
}

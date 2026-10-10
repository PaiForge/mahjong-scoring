import { z } from "zod";

/**
 * アプリ向けの公開プロフィールの API の契約（パス・応答）
 *
 * 公開プロフィールは誰でも読める（web の `/u/<ユーザー名>` と同じ）。ログイン中の
 * アプリは `Authorization` を付けて読み、閲覧者との関係（本人・ブロック中）が
 * 反映された応答を受け取る。付けたトークンが無効なときの扱いはランキングと同じ
 * （`leaderboard/mobile-api.ts`）。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * ある人の公開プロフィールを返す API のパス（GET）
 * 公開プロフィールAPIパス
 *
 * @param username - 公開のユーザー名
 */
export function mobilePublicProfileApiPath(username: string): string {
  return `${MOBILE_API_PREFIX}/users/${encodeURIComponent(username)}`;
}

/**
 * 閲覧者とその人の関係
 * 閲覧者との関係
 *
 * - `guest` — 閲覧者がログインしていない（通報・ブロックにはログインが要る）
 * - `self` — 閲覧者本人のプロフィール（通報・ブロックの操作を出さない）
 * - `member` — ログイン中の他の人（通報・ブロックできる）
 * - `blocking` — 閲覧者がブロックしている（プロフィールの中身を返さない。
 *   web と同じく、ブロック中である旨と解除の操作だけを出す）
 */
export const PUBLIC_PROFILE_RELATIONS = [
  "guest",
  "self",
  "member",
  "blocking",
] as const;

/** 閲覧者とその人の関係（{@link PUBLIC_PROFILE_RELATIONS}） */
export type PublicProfileRelation = (typeof PUBLIC_PROFILE_RELATIONS)[number];

/**
 * 公開プロフィール
 * 公開プロフィール応答
 *
 * 中身の項目は `relation` が `blocking` のときは無い。それ以外でも未設定の
 * 項目は無い。項目を足すときは省略可能にする — ストアに出ている版のアプリが
 * 古い形のまま読む。
 */
export interface MobilePublicProfileResponse {
  readonly username: string;
  readonly relation: PublicProfileRelation;
  readonly displayName?: string;
  /** アバター画像の URL */
  readonly avatarUrl?: string;
  /** 自己紹介 */
  readonly bio?: string;
  /** X のユーザー名（`@` を除く） */
  readonly xUsername?: string;
  /** Instagram のユーザー名（`@` を除く） */
  readonly instagramUsername?: string;
  /** YouTube のハンドル（`@` を除く） */
  readonly youtubeHandle?: string;
}

/**
 * 公開プロフィールの API 固有の失敗の理由
 *
 * - `notFound` — そのユーザー名の人がいない（退会・BAN 済みを含む。web の 404 と同じ）（404）
 */
export const MOBILE_PUBLIC_PROFILE_ERROR_CODES = ["notFound"] as const;

/** 公開プロフィールの API 固有の失敗の理由（{@link MOBILE_PUBLIC_PROFILE_ERROR_CODES}） */
export type MobilePublicProfileErrorCode =
  (typeof MOBILE_PUBLIC_PROFILE_ERROR_CODES)[number];

const publicProfileSchema = z.object({
  username: z.string(),
  relation: z.enum(PUBLIC_PROFILE_RELATIONS),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().optional(),
  xUsername: z.string().optional(),
  instagramUsername: z.string().optional(),
  youtubeHandle: z.string().optional(),
});

/**
 * 公開プロフィールの応答を検証する。形が違えば undefined
 * 公開プロフィール応答検証
 */
export function parseMobilePublicProfileResponse(
  body: unknown,
): MobilePublicProfileResponse | undefined {
  const parsed = publicProfileSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

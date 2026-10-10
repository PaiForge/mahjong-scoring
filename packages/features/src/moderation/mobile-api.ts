import { z } from "zod";

import { REPORT_INPUT_ERRORS, type ReportReason } from "../reports/report";

/**
 * アプリ向けのブロック・通報の API の契約（パス・要求・応答）
 *
 * どれもログインが要る（認証とエラーの理由は `account/mobile-api.ts` と共通）。
 * 相手は公開のユーザー名で指す（内部の ID を外に出さない。web の Server Action と同じ）。
 * ユーザー名を決める前のアカウントも使える（web と同じ）。
 * メソッドは他のアプリ向け API と同じく GET / POST だけ。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/** 相手 1 人の API の親パス */
function userApiPath(username: string): string {
  return `${MOBILE_API_PREFIX}/users/${encodeURIComponent(username)}`;
}

/**
 * 相手をブロックする API のパス（POST。本文なし）
 * ブロックAPIパス
 *
 * 成功なら `{ success: true }`。すでにブロック中でも成功（冪等）。
 */
export function mobileBlockApiPath(username: string): string {
  return `${userApiPath(username)}/block`;
}

/**
 * ブロックを解除する API のパス（POST。本文なし）
 * ブロック解除APIパス
 *
 * 成功なら `{ success: true }`。ブロックしていなくても成功（冪等）。
 */
export function mobileUnblockApiPath(username: string): string {
  return `${userApiPath(username)}/unblock`;
}

/**
 * 相手を通報する API のパス（POST。本文は {@link MobileReportRequest}）
 * 通報APIパス
 *
 * 成功なら `{ success: true }`。同じ相手への未対応の通報があれば、行を増やさずに
 * 成功を返す（運営者への知らせも重ねない）。
 */
export function mobileReportApiPath(username: string): string {
  return `${userApiPath(username)}/report`;
}

/**
 * 通報の要求
 *
 * 検証は web のフォームと同じ `validateReportInput`（その他は詳細が必須・
 * 詳細は 500 文字まで）。
 */
export interface MobileReportRequest {
  readonly reason: ReportReason;
  /** 詳細。書かなければ空文字 */
  readonly detail: string;
}

/**
 * ブロックした人の一覧を返す API のパス（GET）
 * ブロック一覧APIパス
 */
export const MOBILE_BLOCKS_API_PATH = `${MOBILE_API_PREFIX}/blocks`;

/**
 * ブロックした人 1 人
 * ブロック一覧項目
 */
export interface MobileBlockedUser {
  readonly username: string;
  readonly displayName?: string;
  readonly avatarUrl?: string;
}

/**
 * ブロックした人の一覧（ブロックした新しい順）
 * ブロック一覧応答
 *
 * BAN された人も載る（解除の入口を消さないため）。項目を足すときは省略可能にする。
 */
export interface MobileBlocksResponse {
  readonly items: readonly MobileBlockedUser[];
}

/**
 * ブロック・通報の API 固有の失敗の理由
 *
 * - `notFound` — その相手がいない（退会済み。通報では BAN 済みも）（404）
 * - `self` — 自分自身は対象にできない（422）
 * - 通報の入力の誤り（`reports/report.ts` の `ReportInputError`）（422）
 */
export const MOBILE_MODERATION_ERROR_CODES = [
  "notFound",
  "self",
  ...REPORT_INPUT_ERRORS,
] as const;

/** ブロック・通報の API 固有の失敗の理由（{@link MOBILE_MODERATION_ERROR_CODES}） */
export type MobileModerationErrorCode =
  (typeof MOBILE_MODERATION_ERROR_CODES)[number];

const moderationErrorCodeSet: ReadonlySet<string> = new Set(
  MOBILE_MODERATION_ERROR_CODES,
);

/** 値がブロック・通報の API 固有の失敗の理由かを判定する型ガード */
export function isMobileModerationErrorCode(
  value: unknown,
): value is MobileModerationErrorCode {
  return typeof value === "string" && moderationErrorCodeSet.has(value);
}

const blocksSchema = z.object({
  items: z.array(
    z.object({
      username: z.string(),
      displayName: z.string().optional(),
      avatarUrl: z.string().optional(),
    }),
  ),
});

/**
 * ブロックした人の一覧の応答を検証する。形が違えば undefined
 * ブロック一覧応答検証
 */
export function parseMobileBlocksResponse(
  body: unknown,
): MobileBlocksResponse | undefined {
  const parsed = blocksSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

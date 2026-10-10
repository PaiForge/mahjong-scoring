import { z } from "zod";

import { isLeaderboardMenuType, type LeaderboardPeriod } from "./boards";
import type { PracticeBoard } from "../practice-menu-types";

/**
 * アプリ向けのランキングの API の契約（パス・応答）
 *
 * アプリは本人の順位だけを読む。他の人の行（ランキングの詳細）は配らない —
 * アプリの中で他の利用者が入力したもの（ユーザー名・アバター）を見せないため
 * （アプリの `app/leaderboard/index.tsx`）。ランキングそのものは web にある。
 *
 * 土俵の一覧と並びは API で配らない。`boards.ts` を両方が読むので、一覧は
 * 通信を待たずに描け、ここでは本人の順位だけを返す。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * 本人の全土俵の順位を返す API のパス（GET。`?period=` で期間。ログインが要る）
 * ランキング順位APIパス
 */
export const MOBILE_LEADERBOARD_RANKS_API_PATH = `${MOBILE_API_PREFIX}/leaderboard/ranks`;

/**
 * 本人の全土俵の順位の API の URL（パス + クエリ）
 * ランキング順位API URL
 */
export function mobileLeaderboardRanksApiUrl(
  period: LeaderboardPeriod,
): string {
  return `${MOBILE_LEADERBOARD_RANKS_API_PATH}?period=${period}`;
}

/**
 * ある土俵での本人の順位
 * ランキング順位
 */
export interface MobileLeaderboardRank extends PracticeBoard {
  readonly rank: number;
}

/**
 * 本人の全土俵の順位
 * ランキング順位応答
 *
 * 項目を足すときは省略可能にする — ストアに出ている版のアプリが古い形のまま読む。
 */
export interface MobileLeaderboardRanksResponse {
  /** 順位のある土俵だけ（挑戦していない土俵は含まない） */
  readonly ranks: readonly MobileLeaderboardRank[];
  /**
   * 本人がランキングに表示しない設定にしている。そのあいだはどの土俵にも
   * 順位が付かず、`ranks` は空になる
   */
  readonly viewerHidden: boolean;
}

/**
 * ランキングの API 固有の失敗の理由
 *
 * - `notFound` — 期間が無い（404）
 */
export const MOBILE_LEADERBOARD_ERROR_CODES = ["notFound"] as const;

/** ランキングの API 固有の失敗の理由（{@link MOBILE_LEADERBOARD_ERROR_CODES}） */
export type MobileLeaderboardErrorCode =
  (typeof MOBILE_LEADERBOARD_ERROR_CODES)[number];

const ranksSchema = z.object({
  ranks: z.array(
    z.object({
      menuType: z.string(),
      variant: z.string(),
      rank: z.number(),
    }),
  ),
  viewerHidden: z.boolean(),
});

/**
 * 本人の全土俵の順位の応答を検証する。形が違えば undefined
 * ランキング順位応答検証
 *
 * アプリが知らない練習（新しい版のサーバーが足した練習）の順位は落とす。
 */
export function parseMobileLeaderboardRanksResponse(
  body: unknown,
): MobileLeaderboardRanksResponse | undefined {
  const parsed = ranksSchema.safeParse(body);
  if (!parsed.success) return undefined;
  return {
    ...parsed.data,
    ranks: parsed.data.ranks.flatMap(({ menuType, variant, rank }) =>
      isLeaderboardMenuType(menuType) ? [{ menuType, variant, rank }] : [],
    ),
  };
}

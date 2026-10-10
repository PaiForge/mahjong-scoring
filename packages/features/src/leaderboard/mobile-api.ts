import { z } from "zod";

import { isLeaderboardMenuType, type LeaderboardPeriod } from "./boards";
import { menuTypeToSlug, type PracticeBoard } from "../practice-menu-types";
import { VARIANT_PARAM } from "../routes";

/**
 * アプリ向けのランキングの API の契約（パス・応答）
 *
 * ランキングは誰でも読める（web の `/leaderboard` と同じ）。ログイン中のアプリは
 * `Authorization` を付けて読み、自分の順位とブロックした人の除外が効いた応答を
 * 受け取る。ゲストは付けずに読む。付けたトークンが無効なら他のアプリ向け API と
 * 同じく 401（`account/mobile-api.ts`）で、ゲストとしては扱わない — ログインを
 * 失ったことにアプリが気付けなくなるため。
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
 * ある土俵・期間のランキングの 1 ページを返す API の URL（GET）
 * ランキング詳細API URL
 *
 * パスは web の詳細ページ（`/leaderboard/<期間>/<練習>`）と同じ形で、
 * バリアントは `?variant=`（持たない練習では付けない）、ページは `?page=`。
 *
 * @param page - 1 始まりのページ番号
 */
export function mobileLeaderboardApiUrl(
  period: LeaderboardPeriod,
  board: PracticeBoard,
  page: number,
): string {
  const params = new URLSearchParams({
    [VARIANT_PARAM]: board.variant,
    page: String(page),
  });
  return `${MOBILE_API_PREFIX}/leaderboard/${period}/${menuTypeToSlug(board.menuType)}?${params.toString()}`;
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
 * ランキングの 1 行
 * ランキング行
 *
 * 内部のユーザー ID は出さない。本人の行は `isViewer` で示し、プロフィールは
 * 公開のユーザー名で開く。
 */
export interface MobileLeaderboardRow {
  readonly rank: number;
  readonly username: string;
  /** 表示名。未設定なら無い（ユーザー名で出す） */
  readonly displayName?: string;
  /** アバター画像の URL。未設定なら無い */
  readonly avatarUrl?: string;
  readonly score: number;
  readonly incorrectAnswers: number;
  /** 掛かった秒数 */
  readonly timeTaken: number;
  /** 閲覧者本人の行（ゲストには常に false） */
  readonly isViewer: boolean;
}

/**
 * ある土俵・期間のランキングの 1 ページ
 * ランキング詳細応答
 *
 * 並びと順位は web の詳細ページと同じ。閲覧者がブロックした人の行は除いてあるが、
 * 順位・件数・ページ数は全員で共有する集計のまま（1 ページの行が 20 未満に
 * なり、順位が飛ぶことがある）。
 */
export interface MobileLeaderboardResponse {
  readonly rows: readonly MobileLeaderboardRow[];
  /** 返したページ番号（範囲外を要求したら最後のページに丸める） */
  readonly page: number;
  /** 総ページ数。誰も挑戦していなければ 0 */
  readonly totalPages: number;
  /** 順位の付いた人数 */
  readonly totalCount: number;
  /** 閲覧者がこのページにいないときの、閲覧者の順位の行 */
  readonly viewerRow?: MobileLeaderboardRow;
  /** 閲覧者がランキングに表示しない設定にしている（順位の行もハイライトも出ない） */
  readonly viewerHidden: boolean;
}

/**
 * ランキングの API 固有の失敗の理由
 *
 * - `notFound` — 期間・練習が無い、またはランキングを持たない練習（昇級試験）（404）
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

const rowSchema = z.object({
  rank: z.number(),
  username: z.string(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
  score: z.number(),
  incorrectAnswers: z.number(),
  timeTaken: z.number(),
  isViewer: z.boolean(),
});

const leaderboardSchema = z.object({
  rows: z.array(rowSchema),
  page: z.number(),
  totalPages: z.number(),
  totalCount: z.number(),
  viewerRow: rowSchema.optional(),
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

/**
 * ランキングの 1 ページの応答を検証する。形が違えば undefined
 * ランキング詳細応答検証
 */
export function parseMobileLeaderboardResponse(
  body: unknown,
): MobileLeaderboardResponse | undefined {
  const parsed = leaderboardSchema.safeParse(body);
  return parsed.success ? parsed.data : undefined;
}

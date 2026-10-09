import { z } from "zod";

import {
  isPracticeMenuType,
  isPracticeVariant,
  type PracticeBoard,
} from "../practice-menu-types";
import type { ChallengeAttempt, DatePeriod } from "./types";

/**
 * アプリ向けのマイレコードの API の契約（パス・要求・応答）
 *
 * 認証とエラーの理由（`unauthorized` 等）は `account/mobile-api.ts` と共通。
 * ユーザー名を決める前の 409 `usernameRequired` は `mypage/mobile-api.ts` と同じ。
 */

const MOBILE_API_PREFIX = "/api/mobile/v1";

/**
 * マイレコードのダッシュボードの材料を返す API のパス（GET）
 * マイレコードAPIパス
 */
export const MOBILE_RECORDS_API_PATH = `${MOBILE_API_PREFIX}/records`;

/**
 * マイレコードの全履歴を返す API のパス（GET）
 * 全履歴APIパス
 */
export const MOBILE_RECORD_RESULTS_API_PATH = `${MOBILE_API_PREFIX}/records/results`;

/**
 * 土俵を URL クエリ（`menu` / `variant`）にする。web のマイレコードと同じ語彙
 * 土俵クエリ
 */
function boardQuery(board: PracticeBoard | undefined): URLSearchParams {
  const params = new URLSearchParams();
  if (board) {
    params.set("menu", board.menuType);
    params.set("variant", board.variant);
  }
  return params;
}

/**
 * ダッシュボードの API の URL（パス + クエリ）
 * マイレコードAPI URL
 *
 * 土俵を省くと記録を持つ先頭の土俵、期間を省くと今週。
 */
export function mobileRecordsApiUrl(
  board: PracticeBoard | undefined,
  period: DatePeriod,
): string {
  const params = boardQuery(board);
  params.set("period", period);
  return `${MOBILE_RECORDS_API_PATH}?${params.toString()}`;
}

/**
 * 全履歴の API の URL（パス + クエリ）
 * 全履歴API URL
 *
 * @param board - 絞り込む土俵。省くとすべての土俵
 * @param page - 1 始まりのページ番号
 */
export function mobileRecordResultsApiUrl(
  board: PracticeBoard | undefined,
  page: number,
): string {
  const params = boardQuery(board);
  params.set("page", String(page));
  return `${MOBILE_RECORD_RESULTS_API_PATH}?${params.toString()}`;
}

/**
 * ダッシュボードの材料
 * マイレコード応答
 *
 * 期間の境界（JST の週・月）はサーバーが要求を受けた時刻で決める。
 */
export interface MobileRecordsResponse {
  /** 記録を持つ土俵（練習一覧と同じ並び） */
  readonly boards: readonly PracticeBoard[];
  /**
   * 表示する土俵。要求した土俵に記録があればそれ、無ければ先頭。記録が
   * 1 件も無ければ無い
   */
  readonly board?: PracticeBoard;
  /** 選んだ期間のチャレンジ（新しい順） */
  readonly current: readonly ChallengeAttempt[];
  /** 1 つ前の期間のチャレンジ（新しい順。比較と推移の点線に使う） */
  readonly previous: readonly ChallengeAttempt[];
}

/**
 * 全履歴の 1 ページ
 * 全履歴応答
 */
export interface MobileRecordResultsResponse {
  /** このページのチャレンジ（新しい順） */
  readonly items: readonly ChallengeAttempt[];
  /** 返したページ番号（範囲外を要求したら最後のページに丸める） */
  readonly page: number;
  /** 総ページ数。記録が無ければ 0 */
  readonly totalPages: number;
}

/** 応答の JSON に載るチャレンジ（`createdAt` は ISO 8601 の文字列） */
const attemptSchema = z.object({
  id: z.string(),
  menuType: z.string(),
  variant: z.string(),
  score: z.number(),
  incorrectAnswers: z.number(),
  createdAt: z.iso.datetime({ offset: true }),
});

const boardSchema = z.object({ menuType: z.string(), variant: z.string() });

/**
 * 応答の土俵をアプリのレジストリで読む。アプリが知らない練習・バリアント
 * （サーバーがアプリより新しい版で増やしたもの）は undefined
 */
function toBoard(
  value: z.infer<typeof boardSchema>,
): PracticeBoard | undefined {
  const { menuType, variant } = value;
  return isPracticeMenuType(menuType) && isPracticeVariant(menuType, variant)
    ? { menuType, variant }
    : undefined;
}

function toAttempts(
  values: readonly z.infer<typeof attemptSchema>[],
): ChallengeAttempt[] {
  return values.flatMap((value) => {
    const board = toBoard(value);
    if (board === undefined) return [];
    return [
      {
        ...board,
        id: value.id,
        score: value.score,
        incorrectAnswers: value.incorrectAnswers,
        createdAt: new Date(value.createdAt),
      },
    ];
  });
}

const recordsSchema = z.object({
  boards: z.array(boardSchema),
  board: boardSchema.optional(),
  current: z.array(attemptSchema),
  previous: z.array(attemptSchema),
});

/**
 * ダッシュボードの応答を検証する。形が違えば undefined
 * マイレコード応答検証
 *
 * アプリが知らない土俵は一覧からもチャレンジからも落とす。表示する土俵が
 * 知らないものなら `board` を無しにしてチャレンジも空にする（アプリは
 * 一覧の先頭を選び直して読み直す）。
 */
export function parseMobileRecordsResponse(
  body: unknown,
): MobileRecordsResponse | undefined {
  const parsed = recordsSchema.safeParse(body);
  if (!parsed.success) return undefined;
  const boards = parsed.data.boards.flatMap((value) => {
    const board = toBoard(value);
    return board === undefined ? [] : [board];
  });
  const board = parsed.data.board && toBoard(parsed.data.board);
  if (board === undefined) return { boards, current: [], previous: [] };
  return {
    boards,
    board,
    current: toAttempts(parsed.data.current),
    previous: toAttempts(parsed.data.previous),
  };
}

const resultsSchema = z.object({
  items: z.array(attemptSchema),
  page: z.number(),
  totalPages: z.number(),
});

/**
 * 全履歴の応答を検証する。形が違えば undefined
 * 全履歴応答検証
 */
export function parseMobileRecordResultsResponse(
  body: unknown,
): MobileRecordResultsResponse | undefined {
  const parsed = resultsSchema.safeParse(body);
  if (!parsed.success) return undefined;
  return { ...parsed.data, items: toAttempts(parsed.data.items) };
}

"use server";

import { getOptionalUser } from "@/lib/auth";
import { logExternalError } from "@/lib/log-error";
import type { ChallengeAttempt, RecordBoard } from "../_lib/types";
import { isMyRecordBoard } from "../_lib/menu-scope";
import { fetchChallengeAttempts } from "../_lib/queries";

/**
 * 指定した土俵・期間のチャレンジ一覧を取得する
 * チャレンジ取得アクション
 *
 * 土俵はクライアントから渡るため、マイレコードが扱わない種別
 * （昇級試験）と、その練習に無いバリアントはここでも弾く。画面から
 * 選べなくても、このアクションを直接呼べば引けてしまう。
 */
export async function getChallengeAttempts(
  board: RecordBoard,
  currentRangeStart: Date,
  currentRangeEnd: Date,
  previousRangeStart: Date,
  previousRangeEnd: Date,
): Promise<{
  current: ChallengeAttempt[];
  previous: ChallengeAttempt[];
}> {
  try {
    const user = await getOptionalUser();

    if (!user || !isMyRecordBoard(board)) {
      return { current: [], previous: [] };
    }

    return await fetchChallengeAttempts(
      user.id,
      board,
      currentRangeStart,
      currentRangeEnd,
      previousRangeStart,
      previousRangeEnd,
    );
  } catch (error) {
    logExternalError(
      "getChallengeAttempts",
      "failed to fetch challenge attempts",
      error,
    );
    return { current: [], previous: [] };
  }
}

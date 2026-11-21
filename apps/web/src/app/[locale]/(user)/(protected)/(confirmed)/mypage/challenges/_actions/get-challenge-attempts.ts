"use server";

import { getAuthState } from "@/lib/auth";
import type { Fetched } from "@/lib/try-fetch";
import { logExternalError } from "@/lib/log-error";
import type { ChallengeAttempt } from "@mahjong-scoring/features/my-record/types";
import { isMyRecordBoard } from "@mahjong-scoring/features/my-record/menu-scope";
import { fetchChallengeAttempts } from "../_lib/queries";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";

/** 現在の期間と比較対象の期間のチャレンジ */
export interface ChallengeAttemptsByPeriod {
  readonly current: ChallengeAttempt[];
  readonly previous: ChallengeAttempt[];
}

/**
 * 指定した土俵・期間のチャレンジ一覧を取得する
 * チャレンジ取得アクション
 *
 * 土俵はクライアントから渡るため、マイレコードが扱わない種別
 * （昇級試験）と、その練習に無いバリアントはここでも弾く。画面から
 * 選べなくても、このアクションを直接呼べば引けてしまう。
 *
 * 読めなかったときは空を返さず `{ ok: false }` を返す（{@link Fetched}）。
 * 空は「この期間の記録が無い」と読まれ、障害の間、記録が消えたように見える。
 * 読めなかったのは DB に届かないときと、ログイン済みかどうかを確かめられ
 * なかったとき（`getAuthState` の `unknown`）。未ログインは空（事実として無い）。
 */
export async function getChallengeAttempts(
  board: PracticeBoard,
  currentRangeStart: Date,
  currentRangeEnd: Date,
  previousRangeStart: Date,
  previousRangeEnd: Date,
): Promise<Fetched<ChallengeAttemptsByPeriod>> {
  try {
    const state = await getAuthState();
    if (state.kind === "unknown") return { ok: false };
    if (state.kind === "signedOut" || !isMyRecordBoard(board)) {
      return { ok: true, value: { current: [], previous: [] } };
    }

    return {
      ok: true,
      value: await fetchChallengeAttempts(
        state.user.id,
        board,
        currentRangeStart,
        currentRangeEnd,
        previousRangeStart,
        previousRangeEnd,
      ),
    };
  } catch (error) {
    logExternalError(
      "getChallengeAttempts",
      "failed to fetch challenge attempts",
      error,
    );
    return { ok: false };
  }
}

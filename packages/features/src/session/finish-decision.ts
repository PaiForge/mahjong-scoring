import type { FinishReason } from "../challenge/finish-reason";

/**
 * ゲーム終了時の確定結果
 * 終了スナップショット
 *
 * ref から取得するため、React の state バッチングやレンダーサイクルに依存せず
 * 終了時点の正確な値を保持する。
 */
export interface FinalResult {
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly totalCount: number;
  /** 終わった理由。時間切れなら出題中の問題が答えられないまま残っている */
  readonly reason: FinishReason;
  /**
   * 終わった時刻（`Date.now()`）。この回（チャレンジ 1 回分）の ID として、
   * 結果一覧の保存（`useRecordedResults`）と結果ページの URL
   * （`useFinishRedirect` の `?run=`）の両方に同じ値を渡す
   */
  readonly finishedAt: number;
}

/** 正解・不正解の数 */
export interface AnswerCounts {
  readonly correctCount: number;
  readonly incorrectCount: number;
}

/**
 * 回答を数えたあと、チャレンジを終える理由があるか
 * 終了判定
 *
 * ミスが上限に達したら `mistakeLimit`、目標の正解数（昇級試験の合格点）に
 * 届いたら `goalReached`。どちらも無ければ続ける（undefined）。両方同時に
 * 満たすことは無い（1 回の回答は正解か不正解のどちらか）。
 *
 * @param goalCount - ここまで正解したら終える正解数。未指定なら時間切れか
 *   ミス上限まで続く
 */
export function finishReasonAfterAnswer(
  counts: AnswerCounts,
  limits: { readonly mistakeLimit: number; readonly goalCount?: number },
): Extract<FinishReason, "mistakeLimit" | "goalReached"> | undefined {
  if (counts.incorrectCount >= limits.mistakeLimit) return "mistakeLimit";
  if (limits.goalCount !== undefined && counts.correctCount >= limits.goalCount)
    return "goalReached";
  return undefined;
}

/** 終了時点の数と理由から確定結果を組む */
export function finalResultOf(
  counts: AnswerCounts,
  reason: FinishReason,
  finishedAt: number,
): FinalResult {
  return {
    correctCount: counts.correctCount,
    incorrectCount: counts.incorrectCount,
    totalCount: counts.correctCount + counts.incorrectCount,
    reason,
    finishedAt,
  };
}

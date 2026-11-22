import type { DailyAnswerSaveResult } from "./use-answer-record";

/** 本日の問題の記録の状態（`useAnswerRecord` の `status`） */
export type DailyAnswerRecordStatus = DailyAnswerSaveResult | "idle" | "saving";

/**
 * 盤面で利用者に知らせる記録の状態か
 *
 * 知らせるのは、保存できなかった（`failed`）・記録されない（`staleDay` /
 * `anonymous` / `blocked` / `invalidDetail`）ときだけ。確認中・保存中・記録済みは出さない —
 * 本日の問題の盤面を和了形の点数計算（実践練習）と同じ並びに保つため、
 * うまくいっているときは盤面に何も足さない。
 *
 * @param status - 記録の状態
 * @returns 知らせる状態なら true
 */
export function isDailyAnswerSaveProblem(
  status: DailyAnswerRecordStatus,
): status is Exclude<DailyAnswerSaveResult, "saved"> {
  return status !== "idle" && status !== "saving" && status !== "saved";
}

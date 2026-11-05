import { firstUndoneStep, type JourneyItem, type RankJourney } from "./journey";

/**
 * 級の行程を 3 段で見せるための数え方（段の進捗・現在の段）
 * 行程の進捗
 *
 * @description
 * 道場の級のカード（web の `dojo/_components/rank-stage-progress.tsx`・モバイルの
 * `dojo/rank-stage-progress.tsx`）とレッスン完了画面の級の進み具合が読む、
 * 表示向けの派生値。行程そのものは `journey.ts` の `buildJourney` が組み、
 * ここは組まれた {@link RankJourney} を数えるだけで入力を持たない。
 *
 * 「いま取り組んでいる段」は、ホームの「次にやること」と同じ「最初の未了」の
 * 規則（`journey.ts` の {@link firstUndoneStep}）から導く。段の決め方をここで
 * 書き起こさないのは、ホームが指す一歩と道場が照らす段が食い違わないため。
 */

/**
 * 行程の 1 段の進み具合（済んだ数 / 全体）
 * 段の進捗
 */
export interface JourneyStageProgress {
  readonly done: number;
  readonly total: number;
}

/** 項目の並びから進み具合を数える */
export function countProgress(
  items: readonly JourneyItem[],
): JourneyStageProgress {
  return {
    done: items.filter((item) => item.done).length,
    total: items.length,
  };
}

/**
 * 級の行程の 3 段（学ぶ・練習する・認定される）
 * 行程の段
 */
export type JourneyStage = "learn" | "practice" | "exam";

/**
 * 級の行程で、いま取り組んでいる段
 * 現在の段
 *
 * 次の一歩（{@link firstUndoneStep}）が指す項目の段 — レッスンなら学ぶ、
 * 練習なら練習する、道筋が済んでいれば試験。学ぶと練習するは章の順に交互に
 * 進むので、「学ぶがすべて済むまで練習しない」わけではない。
 *
 * 試験に合格した級は undefined。学ぶ・練習するを飛ばして合格した経験者の級に
 * 「いま学ぶ段」を示さないため、道筋より先に合否を見る。
 */
export function currentStage(journey: RankJourney): JourneyStage | undefined {
  if (journey.exam.done) return undefined;
  const step = firstUndoneStep(journey);
  return step.kind === "lesson" ? "learn" : step.kind;
}

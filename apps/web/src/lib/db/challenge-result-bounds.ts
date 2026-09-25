import type { PracticeMenuDescriptor } from "./practice-menu-types";

/**
 * 回答 1 問ごとに挟まる正誤フィードバックの表示時間（ミリ秒）
 * 回答間隔下限
 *
 * `useTimedSession` はこの間は次の回答を受け付けず、制限時間のタイマーは
 * 止めない。したがって 1 回のチャレンジで回答できる問題数は
 * 「制限時間 ÷ この値」を超えられない。値を縮めると
 * {@link maxAnswersWithin} の上限も連動して緩む。
 */
export const ANSWER_FEEDBACK_DURATION_MS = 800;

/**
 * 制限時間内に回答できる問題数の上限
 * 回答数上限
 *
 * 最後の 1 問はフィードバックの途中で時間切れになり得るので 1 問ぶん足す。
 */
export function maxAnswersWithin(timeLimitSeconds: number): number {
  return (
    Math.floor((timeLimitSeconds * 1000) / ANSWER_FEEDBACK_DURATION_MS) + 1
  );
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * クライアントが申告したチャレンジ結果が、ルール上あり得る値か
 * チャレンジ結果妥当性判定
 *
 * 採点はクライアントで行うため、Server Action を直接呼べば任意の値を送れる。
 * ここで弾くのは「どう解いても出ない値」（負値・小数・ミス上限超え・制限時間
 * 超え・時間内に回答しきれない正解数）だけで、あり得る範囲内の水増しは
 * 検出できない。それにはサーバが出題して採点する仕組みが要る。
 *
 * `timeTaken` は秒に丸めた経過時間なので、丸め上がりの 1 秒を許す。
 */
export function isPlausibleChallengeResult(
  rules: Pick<PracticeMenuDescriptor, "mistakeLimit" | "timeLimit">,
  fields: {
    readonly score: number;
    readonly incorrectAnswers: number;
    readonly timeTaken: number;
  },
): boolean {
  const { score, incorrectAnswers, timeTaken } = fields;
  return (
    isNonNegativeInteger(score) &&
    isNonNegativeInteger(incorrectAnswers) &&
    isNonNegativeInteger(timeTaken) &&
    incorrectAnswers <= rules.mistakeLimit &&
    timeTaken <= rules.timeLimit + 1 &&
    score + incorrectAnswers <= maxAnswersWithin(rules.timeLimit)
  );
}

/**
 * クライアントが申告した昇級試験の正解数が、ルール上あり得る値か
 * 試験スコア妥当性判定
 *
 * 範囲の考え方は {@link isPlausibleChallengeResult} と同じ。
 */
export function isPlausibleExamScore(
  rules: Pick<PracticeMenuDescriptor, "timeLimit">,
  score: number,
): boolean {
  return (
    isNonNegativeInteger(score) && score <= maxAnswersWithin(rules.timeLimit)
  );
}

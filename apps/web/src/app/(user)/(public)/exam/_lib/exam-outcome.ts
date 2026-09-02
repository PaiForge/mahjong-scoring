/**
 * 昇級試験 1 回分の結果から、結果画面に出す合否と診断を導く
 * 試験結果判定
 *
 * 合格条件は段級位レジストリの「正解数 ≥ 合格ライン」だけで、時間は条件では
 * ない。ただし制限時間と合格ラインから「合格に必要なペース」は導けるので、
 * 時間切れで届かなかった人にはそれを目標として出す。
 *
 * 試験はミス 1 回で終了するため、終わり方は 2 つしかない:
 *
 * - 誤答で終了（`total - correct ≥ 1`）— 敗因は正確さ。ここで速さの話を
 *   すると「急げば受かる」と誤読させるので、ペースは出さない
 * - 時間切れ（誤答 0）— 敗因は速さ。合格ペースと今回のペースを並べる
 *
 * 合格ラインに達したあとの誤答は合否に影響しない（合格の判定は正解数だけ）。
 */

/** 試験が終わった理由 */
export type ExamEnding = "mistake" | "time";

export interface ExamOutcomeInput {
  readonly correct: number;
  readonly total: number;
  /** 回答に使った時間（ms）。カウントダウンは含まない */
  readonly elapsedMs: number;
  /** 合格ライン（段級位レジストリの `minScore`） */
  readonly minScore: number;
  /** 制限時間（秒。練習レジストリの `timeLimit`） */
  readonly timeLimitSec: number;
}

export interface ExamOutcome {
  readonly passed: boolean;
  /** 合格まであと何問か（合格なら 0） */
  readonly remaining: number;
  readonly ending: ExamEnding;
  /** 1 問あたりの平均秒数。1 問も答えていなければ undefined */
  readonly averageSeconds: number | undefined;
  /** 合格に必要な 1 問あたりの秒数（制限時間 ÷ 合格ライン） */
  readonly requiredPaceSeconds: number;
  /**
   * 合格ペースを見せるか。時間切れで不合格のときだけ真
   * （誤答で終わった人に速さの目標を見せない）
   */
  readonly showRequiredPace: boolean;
}

export function evaluateExamOutcome(input: ExamOutcomeInput): ExamOutcome {
  const { correct, total, elapsedMs, minScore, timeLimitSec } = input;
  const passed = correct >= minScore;
  const ending: ExamEnding = total - correct >= 1 ? "mistake" : "time";
  return {
    passed,
    remaining: Math.max(minScore - correct, 0),
    ending,
    averageSeconds: total > 0 ? elapsedMs / 1000 / total : undefined,
    requiredPaceSeconds: timeLimitSec / minScore,
    showRequiredPace: !passed && ending === "time",
  };
}

import { roundedPercent } from "../percent";

/**
 * 結果の帯に出す件数と正答率
 * スコア帯の数値
 */
export interface ScoreBarFigures {
  /** 正解数（0 以上・全体以下に丸めたもの） */
  readonly correct: number;
  /** 不正解数 */
  readonly incorrect: number;
  /** 全体（0 以上に丸めたもの） */
  readonly total: number;
  /** 正答率（整数の %） */
  readonly accuracy: number;
}

/**
 * 正解数と全体から結果の帯（`ResultScoreBar`）の数値を求める
 * スコア帯の数値計算
 *
 * 帯の幅が負や 100% 超にならないよう、正解数を 0〜全体に丸めてから数える。
 * web とモバイルの帯が同じ数を出す。
 *
 * @param correct - 正解数
 * @param total - 解いた問題数
 */
export function scoreBarFigures(
  correct: number,
  total: number,
): ScoreBarFigures {
  const safeTotal = Math.max(total, 0);
  const safeCorrect = Math.max(Math.min(correct, safeTotal), 0);
  return {
    correct: safeCorrect,
    incorrect: safeTotal - safeCorrect,
    total: safeTotal,
    accuracy: roundedPercent(safeCorrect, safeTotal),
  };
}

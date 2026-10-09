import type { KoTsumoPayment } from "@mahjong-scoring/core";
import type { AvailableScores } from "./get-available-scores";

/**
 * 点数の select に入れた値（選択肢に無い値も含む生の値）
 * 点数の入力値
 *
 * 子ツモは入力方式によらず「子から」「親から」の 2 つで持つ。まとめた
 * select（`koTsumoCombined`）で選んだときも 2 つを同時に入れる。
 */
export interface ScoreInput {
  readonly score: number | undefined;
  readonly scoreFromKo: number | undefined;
  readonly scoreFromOya: number | undefined;
}

/**
 * 今の選択肢に照らして有効な点数の選択
 * 有効な点数選択
 */
export interface ScoreSelection extends ScoreInput {
  /** まとめた select で選ばれている組（`koTsumoCombined` 以外では常に undefined） */
  readonly koTsumoPayment: KoTsumoPayment | undefined;
  /** 答えとして送れるだけ揃っているか */
  readonly isComplete: boolean;
}

const includes = (
  options: readonly number[],
  value: number | undefined,
): number | undefined =>
  value !== undefined && options.includes(value) ? value : undefined;

/**
 * 入力値のうち、今の選択肢に存在するものだけを残す
 * 点数選択の解決
 *
 * select の表示・「入力が揃ったか」・送る回答は、すべてこの戻り値を見る。
 * 生の値をそのまま使うと、選択肢に無い値（聴牌形の点数計算で読み込んだ
 * 回答済みのマスの答えが、分割入力で入れた実在しない組だった、翻数を
 * 変えて選んでいた点数が選択肢から外れた、等）で画面は未選択なのに回答
 * ボタンが押せる・送れてしまう。入力値そのものは消さないので、選択肢が
 * 戻れば選択も戻る。
 */
export function resolveScoreSelection(
  available: AvailableScores,
  input: ScoreInput,
): ScoreSelection {
  switch (available.type) {
    case "single": {
      const score = includes(available.scores, input.score);
      return {
        score,
        scoreFromKo: undefined,
        scoreFromOya: undefined,
        koTsumoPayment: undefined,
        isComplete: score !== undefined,
      };
    }
    case "koTsumoSplit": {
      const scoreFromKo = includes(available.koScores, input.scoreFromKo);
      const scoreFromOya = includes(available.oyaScores, input.scoreFromOya);
      return {
        score: undefined,
        scoreFromKo,
        scoreFromOya,
        koTsumoPayment: undefined,
        isComplete: scoreFromKo !== undefined && scoreFromOya !== undefined,
      };
    }
    case "koTsumoCombined": {
      const { scoreFromKo, scoreFromOya } = input;
      const koTsumoPayment =
        scoreFromKo === undefined || scoreFromOya === undefined
          ? undefined
          : available.payments.find(
              (p) => p.fromKo === scoreFromKo && p.fromOya === scoreFromOya,
            );
      return {
        score: undefined,
        scoreFromKo: koTsumoPayment?.fromKo,
        scoreFromOya: koTsumoPayment?.fromOya,
        koTsumoPayment,
        isComplete: koTsumoPayment !== undefined,
      };
    }
  }
}

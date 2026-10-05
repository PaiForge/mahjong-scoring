import type { QuestionGeneratorOptions } from "@mahjong-scoring/core";
import type { ScoreOptionRange } from "../practice/score/get-available-scores";

/**
 * 点数計算の昇級試験の出題盤面の設定
 * 昇級試験盤面設定
 *
 * 級ごとに違うのは出題条件・点数帯・翻訳名前空間だけで、手牌の提示から
 * 回答フォームまでの構図は共通。web とモバイルの `createScoreExamBoard` が
 * 同じ値を受け取るよう、各級の `exam/<級>/types.ts` が `EXAM_BOARD_CONFIG`
 * として持つ。
 */
export interface ScoreExamBoardConfig {
  /** i18n の翻訳ネームスペース（例: "manganExamChallenge"） */
  readonly translationNamespace: string;
  /** 出題条件（各級の `EXAM_GENERATE_OPTIONS`） */
  readonly generateOptions: QuestionGeneratorOptions;
  /**
   * 回答の選択肢を固定する範囲。`generateOptions.allowedRanges` と揃えること
   * （揃っていないと正解が選択肢に無い問題が出る）。点数帯を絞らない出題は
   * `"all"` を渡す。
   */
  readonly scoreRange: ScoreOptionRange;
  /**
   * 生成の最大試行回数。成立率が低い出題条件（平和・満貫以上）だけが上書きする。
   * 省略時は盤面の出題フックの既定値。
   */
  readonly maxRetries?: number;
}

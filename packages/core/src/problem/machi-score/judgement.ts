import type { HaiKindId } from "@pai-forge/riichi-mahjong";
import { judgeAnswer } from "../score/judgement";
import type {
  JudgementResult,
  ScoreQuestion,
  UserAnswer,
} from "../score/types";
import type { MachiScoreQuestion } from "./types";

/**
 * 待ち牌の回答の判定結果
 * 待ち牌判定
 *
 * 正誤だけでなく「余分に選んだ牌」「選び忘れた牌」を分けて返す。画面は
 * 選択した牌ごとに合っていたかを見せるため（1 枚余分なだけで全体が赤く
 * なると、合っていた牌まで間違いに見える）。
 */
export interface MachiSelectionJudgement {
  readonly isCorrect: boolean;
  /** 正解の待ち牌（出題の並びのまま） */
  readonly correct: readonly HaiKindId[];
  /** 選んだが待ちではなかった牌 */
  readonly extra: readonly HaiKindId[];
  /** 待ちだが選ばなかった牌 */
  readonly missed: readonly HaiKindId[];
}

/**
 * 選んだ牌が待ち牌と過不足なく一致するかを判定する
 * 待ち牌判定
 *
 * @param question - 出題
 * @param selected - 選んだ牌種（重複・順序は問わない）
 */
export function judgeMachiSelection(
  question: Readonly<MachiScoreQuestion>,
  selected: readonly HaiKindId[],
): MachiSelectionJudgement {
  const correct = question.waits.map((wait) => wait.agariHai);
  const selectedSet = new Set(selected);
  const correctSet = new Set(correct);
  const extra = [...selectedSet].filter((hai) => !correctSet.has(hai));
  const missed = correct.filter((hai) => !selectedSet.has(hai));
  return {
    isCorrect: extra.length === 0 && missed.length === 0,
    correct,
    extra,
    missed,
  };
}

/**
 * 待ち牌 1 つ・和了方法 1 つ分（マス）への回答
 * マス回答
 *
 * 点数を答えるか、「役が無く和了れない」と答えるかのどちらか。後者は
 * 門前のロンにだけ正解がある（{@link MachiScoreWait} の `ron` 参照）。
 */
export type MachiCellAnswer =
  | { readonly kind: "score"; readonly answer: UserAnswer }
  | { readonly kind: "noYaku" };

/**
 * マスの判定に使う出題モード
 * マス判定モード
 *
 * 点数計算総合演習の `judgeAnswer` に渡すフラグと同じ。
 */
export interface MachiCellJudgementMode {
  readonly requireYaku: boolean;
  readonly simplifyMangan: boolean;
  readonly requireFuForMangan: boolean;
  readonly allowDoubleYakuman: boolean;
}

/**
 * マス 1 つの回答を判定する
 * マス判定
 *
 * 出題が「役なし」（`cell` が undefined）なら、「役なし」と答えたときだけ
 * 正解。点数を答えるべきマスに「役なし」と答えた場合は、翻・符・点数の
 * すべてを不正解にする（何も答えていないのと同じ）。
 *
 * @param cell - そのマスの点数計算問題。役なしで和了れないマスは undefined
 * @param answer - マスへの回答
 * @param mode - 判定モード
 */
export function judgeMachiCellAnswer(
  cell: Readonly<ScoreQuestion> | undefined,
  answer: MachiCellAnswer,
  mode: MachiCellJudgementMode,
): JudgementResult {
  if (cell === undefined || answer.kind === "noYaku") {
    const isCorrect = cell === undefined && answer.kind === "noYaku";
    return {
      isCorrect,
      isHanCorrect: isCorrect,
      isFuCorrect: isCorrect,
      isScoreCorrect: isCorrect,
      isYakuCorrect: isCorrect,
    };
  }
  return judgeAnswer(
    cell,
    answer.answer,
    mode.requireYaku,
    mode.simplifyMangan,
    mode.requireFuForMangan,
    mode.allowDoubleYakuman,
  );
}

/**
 * マスを一意に指す文字列キー
 * マスキー
 *
 * 画面側が回答を Map に持つときのキー。待ち牌の牌種 ID と和了方法から
 * 決まり、同じ出題の中で衝突しない。
 */
export function machiCellKey(agariHai: HaiKindId, isTsumo: boolean): string {
  return `${agariHai}:${isTsumo ? "tsumo" : "ron"}`;
}

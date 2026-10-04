import { mentsuTehaiFu, type WinType } from "@mahjong-scoring/core";

import { buildExtraFuRows } from "../curriculum/extra-fu-rows";
import {
  HAND_SHAPE_MENZEN,
  type FixedHandShape,
} from "../practice/score/hand-shape-param";
import type { LessonQuestion, LessonQuiz } from "./quiz";

/** 積み上げた符の確認問題 1 問の定義 */
export interface ExtraFuQuestionSource {
  readonly key: string;
  readonly winType: WinType;
  /** 面子・雀頭・待ちで積み上げた符の合計 */
  readonly extraFu: number;
}

/**
 * 積み上げた符から手牌の符を問う確認問題を組む
 * 積み上げ符の確認問題
 *
 * 符は core の `mentsuTehaiFu`（教本の対応表と同じ計算）から引き、選択肢は
 * 教本の対応表（`buildExtraFuRows`）に現れる符すべて。表で見た値が
 * そのまま選択肢に並ぶ。
 *
 * @param handShape 門前手 / 副露した手
 * @param questions 出題順の問題
 */
export function buildExtraFuQuiz(
  handShape: FixedHandShape,
  questions: readonly ExtraFuQuestionSource[],
): LessonQuiz {
  const isMenzen = handShape === HAND_SHAPE_MENZEN;
  return {
    questions: questions.map(({ key, winType, extraFu }): LessonQuestion => ({
      key,
      prompt: { kind: "extraFu", handShape, winType, extraFu },
      answer: { kind: "fu", fu: mentsuTehaiFu(extraFu, { winType, isMenzen }) },
    })),
    choices: [
      ...new Set(
        buildExtraFuRows(handShape).flatMap((row) => [row.tsumoFu, row.ronFu]),
      ),
    ]
      .sort((a, b) => a - b)
      .map((fu) => ({ kind: "fu", fu })),
  };
}

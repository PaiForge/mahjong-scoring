import { describe, expect, it } from "vitest";
import {
  machiCellKey,
  type MachiCellAnswer,
  type TenpaiScoreQuestion,
} from "@mahjong-scoring/core";
import { scoreAnswerToUserAnswer } from "../../results/payment-adapter";
import { TENPAI_SCORE_DEMO_QUESTION } from "./demo-question";
import { judgeAllCells } from "./judge-cells";

const MODE = {
  requireYaku: false,
  requireHanFu: true,
  exactHan: false,
  requireFuForMangan: false,
  allowDoubleYakuman: false,
} as const;

/** 正解の点数をそのまま答えるマスの回答（役なしのマスは「役なし」） */
function correctAnswerOf(
  wait: TenpaiScoreQuestion["waits"][number],
  isTsumo: boolean,
): MachiCellAnswer {
  const cell = isTsumo ? wait.tsumo : wait.ron;
  return cell === undefined
    ? { kind: "noYaku" }
    : { kind: "score", answer: scoreAnswerToUserAnswer(cell.answer) };
}

describe("judgeAllCells", () => {
  const question = TENPAI_SCORE_DEMO_QUESTION;
  const allCorrect: Record<string, MachiCellAnswer> = {};
  for (const wait of question.waits) {
    for (const isTsumo of [true, false]) {
      allCorrect[machiCellKey(wait.agariHai, isTsumo)] = correctAnswerOf(
        wait,
        isTsumo,
      );
    }
  }

  it("全マスの判定を返し、すべて正解なら allCorrect", () => {
    const { results, allCorrect: ok } = judgeAllCells(
      question,
      allCorrect,
      MODE,
    );
    expect(Object.keys(results)).toHaveLength(question.waits.length * 2);
    expect(Object.values(results).every((r) => r.isCorrect)).toBe(true);
    expect(ok).toBe(true);
  });

  it("未回答のマスは不正解として数え、全体も不正解になる", () => {
    const key = machiCellKey(question.waits[0].agariHai, true);
    const { [key]: _omitted, ...missingOne } = allCorrect;
    const { results, allCorrect: ok } = judgeAllCells(
      question,
      missingOne,
      MODE,
    );
    expect(results[key].isCorrect).toBe(false);
    expect(ok).toBe(false);
  });
});

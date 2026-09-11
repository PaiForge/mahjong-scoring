import { describe, it, expect } from "vitest";
import { generateMachiScoreQuestion } from "./generator";
import {
  judgeMachiCellAnswer,
  judgeMachiSelection,
  machiCellKey,
  type MachiCellJudgementMode,
} from "./judgement";
import type { MachiScoreQuestion } from "./types";
import type { ScoreQuestion, UserAnswer } from "../score/types";
import { ALL_HAI_KINDS } from "../../core/constants";
import { expectSampled, generateOne } from "../../test/sampling";

const MODE: MachiCellJudgementMode = {
  requireYaku: false,
  simplifyMangan: false,
  requireFuForMangan: false,
  allowDoubleYakuman: false,
};

/** 出題の正解からそのまま作った回答 */
function correctAnswerOf(cell: ScoreQuestion): UserAnswer {
  const { payment } = cell.answer;
  const base = { han: cell.answer.han, fu: cell.answer.fu, yakus: [] };
  return payment.type === "koTsumo"
    ? {
        ...base,
        scoreFromKo: payment.amount[0],
        scoreFromOya: payment.amount[1],
      }
    : { ...base, score: payment.amount };
}

/** 役なしのロン待ちを持つ出題を 1 つ取る */
function questionWithNoYakuRon(): MachiScoreQuestion {
  const [question] = expectSampled(generateMachiScoreQuestion, {
    attempts: 500,
    need: 1,
    where: (q) => q.waits.some((wait) => !wait.ron),
  });
  return question;
}

describe("judgeMachiSelection", () => {
  it("待ち牌と過不足なく一致すれば正解", () => {
    const question = generateOne(generateMachiScoreQuestion);
    const waits = question.waits.map((wait) => wait.agariHai);
    // 順序と重複は問わない
    const result = judgeMachiSelection(
      question,
      [...waits].reverse().concat(waits[0]),
    );
    expect(result.isCorrect).toBe(true);
    expect(result.correct).toEqual(waits);
    expect(result.extra).toEqual([]);
    expect(result.missed).toEqual([]);
  });

  it("余分な牌と選び忘れた牌を分けて返す", () => {
    const question = generateOne(generateMachiScoreQuestion);
    const waits = question.waits.map((wait) => wait.agariHai);
    const notWait = ALL_HAI_KINDS.find((id) => !waits.includes(id));
    if (notWait === undefined) throw new Error("待ちでない牌が無い");
    const [kept, ...dropped] = waits;
    const result = judgeMachiSelection(question, [kept, notWait]);
    expect(result.isCorrect).toBe(false);
    expect(result.extra).toEqual([notWait]);
    expect(result.missed).toEqual(dropped);
  });

  it("何も選ばなければ待ち牌がすべて選び忘れになる", () => {
    const question = generateOne(generateMachiScoreQuestion);
    const result = judgeMachiSelection(question, []);
    expect(result.isCorrect).toBe(false);
    expect(result.missed).toEqual(result.correct);
  });
});

describe("judgeMachiCellAnswer", () => {
  it("正解どおりの点数を答えれば正解", () => {
    const question = generateOne(generateMachiScoreQuestion);
    const cell = question.waits[0].tsumo;
    const result = judgeMachiCellAnswer(
      cell,
      { kind: "score", answer: correctAnswerOf(cell) },
      MODE,
    );
    expect(result.isCorrect).toBe(true);
  });

  it("点数を答えるべきマスに「役なし」と答えると全項目が不正解", () => {
    const question = generateOne(generateMachiScoreQuestion);
    const result = judgeMachiCellAnswer(
      question.waits[0].tsumo,
      { kind: "noYaku" },
      MODE,
    );
    expect(result).toEqual({
      isCorrect: false,
      isHanCorrect: false,
      isFuCorrect: false,
      isScoreCorrect: false,
      isYakuCorrect: false,
    });
  });

  it("役なしのマスは「役なし」と答えたときだけ正解", () => {
    const question = questionWithNoYakuRon();
    const wait = question.waits.find((w) => !w.ron);
    if (!wait) throw new Error("役なしのロン待ちが無い");

    expect(judgeMachiCellAnswer(wait.ron, { kind: "noYaku" }, MODE)).toEqual({
      isCorrect: true,
      isHanCorrect: true,
      isFuCorrect: true,
      isScoreCorrect: true,
      isYakuCorrect: true,
    });
    // 点数を答えても、それがツモ側の正解と同じ値でも不正解
    const result = judgeMachiCellAnswer(
      wait.ron,
      { kind: "score", answer: correctAnswerOf(wait.tsumo) },
      MODE,
    );
    expect(result.isCorrect).toBe(false);
  });
});

describe("machiCellKey", () => {
  it("待ち牌と和了方法の組ごとに異なる", () => {
    const keys = new Set([
      machiCellKey(0, true),
      machiCellKey(0, false),
      machiCellKey(1, true),
      machiCellKey(1, false),
    ]);
    expect(keys.size).toBe(4);
  });
});

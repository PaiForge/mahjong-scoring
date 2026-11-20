import { describe, expect, it } from "vitest";
import { HaiKind, machiCellKey } from "@mahjong-scoring/core";
import type { TenpaiScoreQuestion } from "@mahjong-scoring/core";

import { cellKeyOf, cellQuestionOf, listCellRefs } from "./cell-ref";
import { TENPAI_SCORE_DEMO_QUESTION } from "./demo-question";

const question = TENPAI_SCORE_DEMO_QUESTION;
const [first, second] = question.waits;

describe("cellKeyOf", () => {
  it("core のマスのキーと同じ文字列を返し、ツモとロンで別のキーになる", () => {
    expect(cellKeyOf({ agariHai: first.agariHai, isTsumo: true })).toBe(
      machiCellKey(first.agariHai, true),
    );
    expect(cellKeyOf({ agariHai: first.agariHai, isTsumo: false })).toBe(
      machiCellKey(first.agariHai, false),
    );
    expect(cellKeyOf({ agariHai: first.agariHai, isTsumo: true })).not.toBe(
      cellKeyOf({ agariHai: first.agariHai, isTsumo: false }),
    );
  });
});

describe("listCellRefs", () => {
  it("ツモ列を待ちの順に、続けてロン列を待ちの順に並べる", () => {
    expect(listCellRefs(question)).toEqual([
      { agariHai: first.agariHai, isTsumo: true },
      { agariHai: second.agariHai, isTsumo: true },
      { agariHai: first.agariHai, isTsumo: false },
      { agariHai: second.agariHai, isTsumo: false },
    ]);
  });
});

describe("cellQuestionOf", () => {
  it("ツモのマスはその待ちのツモの出題を、ロンのマスはロンの出題を返す", () => {
    expect(
      cellQuestionOf(question, { agariHai: second.agariHai, isTsumo: true }),
    ).toBe(second.tsumo);
    expect(
      cellQuestionOf(question, { agariHai: second.agariHai, isTsumo: false }),
    ).toBe(second.ron);
  });

  it("待ちに無い牌のマスは出題を持たない", () => {
    expect(
      cellQuestionOf(question, { agariHai: HaiKind.SouZu9, isTsumo: true }),
    ).toBeUndefined();
    expect(
      cellQuestionOf(question, { agariHai: HaiKind.SouZu9, isTsumo: false }),
    ).toBeUndefined();
  });

  it("役が無くロンできない待ちのロンのマスは出題を持たない", () => {
    const noRon: TenpaiScoreQuestion = {
      ...question,
      waits: [{ ...first, ron: undefined }],
    };
    expect(
      cellQuestionOf(noRon, { agariHai: first.agariHai, isTsumo: false }),
    ).toBeUndefined();
    expect(
      cellQuestionOf(noRon, { agariHai: first.agariHai, isTsumo: true }),
    ).toBe(first.tsumo);
  });
});

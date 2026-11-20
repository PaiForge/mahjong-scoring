// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { ShownScore } from "@/lib/problem-reports/snapshot";

import {
  SHOWN_SCORE_FIELDS,
  answersDiffer,
  compareShownAnswers,
  differingScoreFields,
  type ComparableAnswer,
} from "../answer-comparison";

/** 子のロン 30 符 2 翻（2000 点）。上書きで 1 項目ずつ変える */
function score(overrides: Partial<ShownScore> = {}): ShownScore {
  return {
    han: 2,
    fu: 30,
    scoreLevel: "Normal",
    payment: { type: "ron", amount: 2000 },
    yakumanMultiplier: 0,
    yaku: [
      { name: "Tanyao", han: 1 },
      { name: "Pinfu", han: 1 },
    ],
    ...overrides,
  };
}

function agari(s: ShownScore): ComparableAnswer {
  return { kind: "agari-score", score: s };
}

describe("differingScoreFields", () => {
  it("同じ正解なら食い違う項目は無い", () => {
    expect(differingScoreFields(score(), score())).toEqual([]);
  });

  it("翻と点数が変わったら、その項目だけを食い違いに挙げる", () => {
    expect(
      differingScoreFields(
        score(),
        score({ han: 3, payment: { type: "ron", amount: 3900 } }),
      ),
    ).toEqual(["han", "payment"]);
  });

  it("支払いはキーの順が違っても同じとみなす（jsonb はキーの順を保たない）", () => {
    const reordered = score({
      payment: JSON.parse('{"amount":[1000,2000],"type":"koTsumo"}'),
    });
    expect(
      differingScoreFields(
        score({ payment: { type: "koTsumo", amount: [1000, 2000] } }),
        reordered,
      ),
    ).toEqual([]);
  });

  it("ツモの支払いの子と親が入れ替わったら食い違いとする", () => {
    expect(
      differingScoreFields(
        score({ payment: { type: "koTsumo", amount: [1000, 2000] } }),
        score({ payment: { type: "koTsumo", amount: [2000, 1000] } }),
      ),
    ).toEqual(["payment"]);
  });

  it("役の並びだけが違うときは同じとみなし、役の翻が違えば食い違いとする", () => {
    const reversed = score({
      yaku: [
        { name: "Pinfu", han: 1 },
        { name: "Tanyao", han: 1 },
      ],
    });
    expect(differingScoreFields(score(), reversed)).toEqual([]);
    expect(
      differingScoreFields(
        score(),
        score({
          yaku: [
            { name: "Tanyao", han: 1 },
            { name: "Pinfu", han: 2 },
          ],
        }),
      ),
    ).toEqual(["yaku"]);
  });

  it("片方だけが役なし（null）なら全項目が食い違い、両方役なしなら食い違わない", () => {
    expect(differingScoreFields(null, score())).toEqual(SHOWN_SCORE_FIELDS);
    expect(differingScoreFields(score(), null)).toEqual(SHOWN_SCORE_FIELDS);
    expect(differingScoreFields(null, null)).toEqual([]);
  });
});

describe("compareShownAnswers", () => {
  it("和了形は点数の食い違う項目を返す", () => {
    const comparison = compareShownAnswers(
      agari(score()),
      agari(score({ fu: 40 })),
    );
    expect(comparison).toEqual({ kind: "agari-score", score: ["fu"] });
    expect(answersDiffer(comparison)).toBe(true);
  });

  it("採点が変わっていなければ食い違いなし", () => {
    expect(
      answersDiffer(compareShownAnswers(agari(score()), agari(score()))),
    ).toBe(false);
  });

  it("聴牌形は待ちごとに見比べ、片方にしか無い待ちを印す", () => {
    const comparison = compareShownAnswers(
      {
        kind: "tenpai-score",
        waits: [
          { agariHai: 1, tsumo: score(), ron: score() },
          { agariHai: 4, tsumo: score(), ron: null },
        ],
      },
      {
        kind: "tenpai-score",
        waits: [
          { agariHai: 1, tsumo: score({ han: 3 }), ron: null },
          { agariHai: 7, tsumo: score(), ron: score() },
        ],
      },
    );
    expect(comparison).toEqual({
      kind: "tenpai-score",
      waits: [
        {
          agariHai: 1,
          presence: "both",
          tsumo: ["han"],
          ron: SHOWN_SCORE_FIELDS,
        },
        { agariHai: 4, presence: "reportedOnly", tsumo: [], ron: [] },
        { agariHai: 7, presence: "currentOnly", tsumo: [], ron: [] },
      ],
    });
    expect(answersDiffer(comparison)).toBe(true);
  });

  it("聴牌形で待ちも点数も同じなら食い違いなし", () => {
    const answer: ComparableAnswer = {
      kind: "tenpai-score",
      waits: [{ agariHai: 1, tsumo: score(), ron: null }],
    };
    expect(answersDiffer(compareShownAnswers(answer, answer))).toBe(false);
  });

  it("片方だけが組み立てられなければ食い違いとする", () => {
    const comparison = compareShownAnswers(
      { rebuildError: "fuOutOfOptions" },
      agari(score()),
    );
    expect(comparison).toEqual({ kind: "incomparable", differs: true });
    expect(
      answersDiffer(
        compareShownAnswers(agari(score()), { rebuildError: "noYaku" }),
      ),
    ).toBe(true);
  });

  it("両方が同じ理由で組み立てられなければ食い違いなし、理由が違えば食い違い", () => {
    expect(
      compareShownAnswers(
        { rebuildError: "noYaku" },
        { rebuildError: "noYaku" },
      ),
    ).toEqual({ kind: "incomparable", differs: false });
    expect(
      answersDiffer(
        compareShownAnswers(
          { rebuildError: "noYaku" },
          { rebuildError: "malformed" },
        ),
      ),
    ).toBe(true);
  });

  it("問題の種別が違えば食い違いとする", () => {
    expect(
      compareShownAnswers(agari(score()), { kind: "tenpai-score", waits: [] }),
    ).toEqual({ kind: "incomparable", differs: true });
  });
});

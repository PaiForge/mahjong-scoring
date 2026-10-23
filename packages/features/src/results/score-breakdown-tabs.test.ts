import { describe, expect, it } from "vitest";

import {
  buildScoreBreakdownTabs,
  scoreBreakdownTabLabel,
} from "./score-breakdown-tabs";

const fu = { details: [{ reason: "副底", fu: 20 }], answer: 30 };
const yakuDetails = [
  { name: "立直", han: 1 },
  { name: "ドラ", han: 2 },
];

describe("buildScoreBreakdownTabs", () => {
  it("符・翻数のタブを表記順に並べ、翻数の合計を添える", () => {
    expect(
      buildScoreBreakdownTabs("fu-first", fu, yakuDetails, undefined),
    ).toEqual({
      tabs: [
        { kind: "fu", fu },
        { kind: "han", yakuDetails, hanTotal: 3 },
      ],
      initial: "fu",
    });
  });

  it("符が無ければ翻数だけ、役の内訳が空なら符だけを並べる", () => {
    expect(
      buildScoreBreakdownTabs("fu-first", undefined, yakuDetails, undefined)
        .tabs,
    ).toEqual([{ kind: "han", yakuDetails, hanTotal: 3 }]);
    expect(buildScoreBreakdownTabs("han-first", fu, [], undefined)).toEqual({
      tabs: [{ kind: "fu", fu }],
      initial: "fu",
    });
  });

  it("片方だけ間違えたら、開いたときにその内訳を選ぶ", () => {
    expect(
      buildScoreBreakdownTabs("fu-first", fu, yakuDetails, {
        isHanCorrect: false,
        isFuCorrect: true,
      }).initial,
    ).toBe("han");
  });
});

describe("scoreBreakdownTabLabel", () => {
  const t = (key: "fuTab" | "hanTab", values: Record<string, number>) =>
    `${key}:${JSON.stringify(values)}`;

  it("符は正解の符、翻数は丸めの前の合計を添える", () => {
    expect(scoreBreakdownTabLabel({ kind: "fu", fu }, t)).toBe(
      'fuTab:{"value":30}',
    );
    expect(
      scoreBreakdownTabLabel({ kind: "han", yakuDetails, hanTotal: 3 }, t),
    ).toBe('hanTab:{"count":3}');
  });
});

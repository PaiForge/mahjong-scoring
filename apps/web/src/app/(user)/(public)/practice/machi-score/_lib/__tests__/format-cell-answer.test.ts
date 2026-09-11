import { describe, expect, it } from "vitest";
import { formatCellAnswer } from "../format-cell-answer";

/** 辞書の代わり。キーの末尾だけを返す */
const t = (key: string) =>
  ({
    "form.options.hanSuffix": "翻",
    "form.options.fuSuffix": "符",
    "form.options.all": "オール",
    "form.options.mangan": "満貫",
    "result.pointSuffix": "点",
  })[key] ?? key;

const base = {
  t,
  noYakuLabel: "役なし",
  simplifyMangan: false,
  allowDoubleYakuman: false,
};

describe("formatCellAnswer", () => {
  it("ロンは「n点」、親ツモは「nオール」、子ツモは「a/b」で、ツモに「点」は付けない", () => {
    expect(
      formatCellAnswer(
        { kind: "score", answer: { han: 3, fu: 40, score: 5200, yakus: [] } },
        { ...base, isOyaTsumo: false },
      ),
    ).toBe("3翻 40符 5200点");
    expect(
      formatCellAnswer(
        { kind: "score", answer: { han: 1, fu: 30, score: 500, yakus: [] } },
        { ...base, isOyaTsumo: true },
      ),
    ).toBe("1翻 30符 500オール");
    expect(
      formatCellAnswer(
        {
          kind: "score",
          answer: {
            han: 2,
            fu: 30,
            scoreFromKo: 500,
            scoreFromOya: 1000,
            yakus: [],
          },
        },
        { ...base, isOyaTsumo: false },
      ),
    ).toBe("2翻 30符 500/1000");
  });

  it("満貫以上は簡略化のときだけ区分名で出し、符が無ければ省く", () => {
    const answer = { han: 5, fu: undefined, score: 8000, yakus: [] };
    expect(
      formatCellAnswer(
        { kind: "score", answer },
        { ...base, simplifyMangan: true, isOyaTsumo: false },
      ),
    ).toBe("満貫 8000点");
    expect(
      formatCellAnswer(
        { kind: "score", answer },
        { ...base, isOyaTsumo: false },
      ),
    ).toBe("5翻 8000点");
  });

  it("役なしは文言だけ", () => {
    expect(
      formatCellAnswer({ kind: "noYaku" }, { ...base, isOyaTsumo: false }),
    ).toBe("役なし");
  });
});

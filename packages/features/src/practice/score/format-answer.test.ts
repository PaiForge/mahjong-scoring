import { describe, expect, it } from "vitest";
import { formatHan, formatPayment } from "./format-answer";

/** 辞書の代わり */
const t = (key: string) =>
  ({
    "form.options.hanSuffix": "翻",
    "form.options.all": "オール",
    "form.options.haneman": "跳満",
    "result.pointSuffix": "点",
  })[key] ?? key;

describe("formatHan", () => {
  it("満貫以上を区分名で出す設定なら区分名にする", () => {
    expect(
      formatHan(6, { t, simplifyMangan: true, allowDoubleYakuman: false }),
    ).toBe("跳満");
  });

  it("区分名で出さない設定なら翻数のまま", () => {
    expect(
      formatHan(6, { t, simplifyMangan: false, allowDoubleYakuman: false }),
    ).toBe("6翻");
  });
});

describe("formatPayment", () => {
  it("ロンは「n点」、親ツモは「nオール」、子ツモは「a/b」", () => {
    expect(
      formatPayment({ han: 1, fu: 30, score: 1000, yakus: [] }, false, { t }),
    ).toBe("1000点");
    expect(
      formatPayment({ han: 1, fu: 30, score: 500, yakus: [] }, true, { t }),
    ).toBe("500オール");
    expect(
      formatPayment(
        { han: 1, fu: 30, scoreFromKo: 300, scoreFromOya: 500, yakus: [] },
        false,
        { t },
      ),
    ).toBe("300/500");
  });
});

import { describe, expect, it } from "vitest";

import { practiceHanOptions } from "./answer-options";

/** 辞書の代わり。キーをそのまま返す */
const t = (key: string) => key;

describe("practiceHanOptions", () => {
  it("区分名で出す設定では 1〜4翻のあとに満貫以上の区分を昇順で並べる", () => {
    const options = practiceHanOptions(t, true, false);
    expect(options.slice(0, 4).map((o) => o.value)).toEqual([1, 2, 3, 4]);
    expect(options[4]).toEqual({ value: 5, label: "form.options.mangan" });
  });

  it("区分名で出さない設定では役満未満を数値で出し、役満だけを区分名にする", () => {
    const options = practiceHanOptions(t, false, false);
    expect(options).toHaveLength(13);
    expect(options.at(-1)).toEqual({
      value: 13,
      label: "form.options.yakuman",
    });
  });
});

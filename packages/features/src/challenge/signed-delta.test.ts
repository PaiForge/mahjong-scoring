import { describe, expect, it } from "vitest";

import { formatSignedDelta, signedDeltaTone } from "./signed-delta";

describe("formatSignedDelta", () => {
  it("増加はプラス符号を付ける", () => {
    expect(formatSignedDelta(2)).toBe("+2");
  });

  it("減少はハイフンではなく U+2212 を使う", () => {
    expect(formatSignedDelta(-7)).toBe("−7");
    expect(formatSignedDelta(-7)).not.toBe("-7");
  });

  it("増減なしは ±0", () => {
    expect(formatSignedDelta(0)).toBe("±0");
  });

  it("指定した小数桁数で揃える", () => {
    expect(formatSignedDelta(1.5, 1)).toBe("+1.5");
    expect(formatSignedDelta(-2, 1)).toBe("−2.0");
  });

  it("符号を決める前に丸めるため、表示上 0 になる増減は ±0", () => {
    expect(formatSignedDelta(0.04, 1)).toBe("±0");
    expect(formatSignedDelta(-0.04, 1)).toBe("±0");
    expect(formatSignedDelta(0.05, 1)).toBe("+0.1");
  });

  it("小数桁数を指定しなければ整数に丸める", () => {
    expect(formatSignedDelta(0.4)).toBe("±0");
    expect(formatSignedDelta(0.6)).toBe("+1");
  });
});

describe("signedDeltaTone", () => {
  it("表示に使う丸めと同じ基準で向きを決める", () => {
    expect(signedDeltaTone(3)).toBe("up");
    expect(signedDeltaTone(-1)).toBe("down");
    expect(signedDeltaTone(0)).toBe("flat");
    expect(signedDeltaTone(0.04, 1)).toBe("flat");
    expect(signedDeltaTone(0.4)).toBe("flat");
  });
});

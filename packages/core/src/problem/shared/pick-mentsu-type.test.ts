import { describe, expect, it } from "vitest";
import { pickMentsuType } from "./pick-mentsu-type";

describe("pickMentsuType", () => {
  const weights = { shuntsu: 0.2, koutsu: 0.5 };

  it("乱数が順子の重みちょうどなら順子ではなく刻子を選ぶ（順子は重み未満だけ）", () => {
    expect(pickMentsuType(weights, () => weights.shuntsu)).toBe("koutsu");
  });

  it("乱数が順子と刻子の重みの和ちょうどなら槓子を選ぶ（刻子は和の未満だけ）", () => {
    expect(
      pickMentsuType(weights, () => weights.shuntsu + weights.koutsu),
    ).toBe("kantsu");
  });

  it("重みの範囲に応じて順子・刻子・槓子を選ぶ", () => {
    expect(pickMentsuType(weights, () => 0)).toBe("shuntsu");
    expect(pickMentsuType(weights, () => 0.5)).toBe("koutsu");
    expect(pickMentsuType(weights, () => 0.99)).toBe("kantsu");
  });
});

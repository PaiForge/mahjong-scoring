import { describe, it, expect } from "vitest";
import { calculateKoScore, calculateOyaScore, isInvalidCell } from "./score-calculation";

describe("calculateKoScore", () => {
  it("1翻30符の子ロンは1000点", () => {
    const result = calculateKoScore(1, 30);
    expect(result).toEqual({ isMangan: false, ron: 1000, tsumo: "300/500" });
  });

  it("1翻40符の子ロンは1300点", () => {
    const result = calculateKoScore(1, 40);
    expect(result).toEqual({ isMangan: false, ron: 1300, tsumo: "400/700" });
  });

  it("2翻30符の子ロンは2000点", () => {
    const result = calculateKoScore(2, 30);
    expect(result).toEqual({ isMangan: false, ron: 2000, tsumo: "500/1000" });
  });

  it("3翻30符の子ロンは3900点", () => {
    const result = calculateKoScore(3, 30);
    expect(result).toEqual({ isMangan: false, ron: 3900, tsumo: "1000/2000" });
  });

  it("3翻40符の子ロンは5200点", () => {
    const result = calculateKoScore(3, 40);
    expect(result).toEqual({ isMangan: false, ron: 5200, tsumo: "1300/2600" });
  });

  it("4翻30符の子は満貫(base=1920 < 2000)", () => {
    const result = calculateKoScore(4, 30);
    expect(result).toEqual({ isMangan: false, ron: 7700, tsumo: "2000/3900" });
  });

  it("3翻70符の子は満貫(base=2240 >= 2000)", () => {
    const result = calculateKoScore(3, 70);
    expect(result).toEqual({ isMangan: true, ron: 8000, tsumo: "2000/4000" });
  });

  it("4翻40符の子は満貫(base=2560 >= 2000)", () => {
    const result = calculateKoScore(4, 40);
    expect(result).toEqual({ isMangan: true, ron: 8000, tsumo: "2000/4000" });
  });

  it("2翻25符の子ロンは1600点（七対子ロン）", () => {
    const result = calculateKoScore(2, 25);
    expect(result).toEqual({ isMangan: false, ron: 1600, tsumo: "400/800" });
  });

  it("100点単位の切り上げが正しい", () => {
    // 1翻30符: base = 30 * 2^3 = 240
    // ron = 240 * 4 = 960 -> ceil(960/100)*100 = 1000
    const result = calculateKoScore(1, 30);
    expect(result.ron).toBe(1000);
  });
});

describe("calculateOyaScore", () => {
  it("1翻30符の親ロンは1500点", () => {
    const result = calculateOyaScore(1, 30);
    expect(result).toEqual({ isMangan: false, ron: 1500, tsumo: "500∀" });
  });

  it("1翻40符の親ロンは2000点", () => {
    const result = calculateOyaScore(1, 40);
    expect(result).toEqual({ isMangan: false, ron: 2000, tsumo: "700∀" });
  });

  it("2翻30符の親ロンは2900点", () => {
    // base = 30 * 2^4 = 480, ron = 480*6 = 2880 -> 2900
    const result = calculateOyaScore(2, 30);
    expect(result).toEqual({ isMangan: false, ron: 2900, tsumo: "1000∀" });
  });

  it("3翻30符の親ロンは5800点", () => {
    const result = calculateOyaScore(3, 30);
    expect(result).toEqual({ isMangan: false, ron: 5800, tsumo: "2000∀" });
  });

  it("3翻40符の親ロンは7700点", () => {
    // base = 40 * 2^5 = 1280, ron = 1280*6 = 7680 -> 7700
    const result = calculateOyaScore(3, 40);
    expect(result).toEqual({ isMangan: false, ron: 7700, tsumo: "2600∀" });
  });

  it("4翻40符の親は満貫(base=2560 >= 2000)", () => {
    const result = calculateOyaScore(4, 40);
    expect(result).toEqual({ isMangan: true, ron: 12000, tsumo: "4000∀" });
  });

  it("3翻70符の親は満貫", () => {
    const result = calculateOyaScore(3, 70);
    expect(result).toEqual({ isMangan: true, ron: 12000, tsumo: "4000∀" });
  });

  it("2翻25符の親ロンは2400点", () => {
    // base = 25 * 2^4 = 400, ron = 400*6 = 2400
    const result = calculateOyaScore(2, 25);
    expect(result).toEqual({ isMangan: false, ron: 2400, tsumo: "800∀" });
  });
});

describe("isInvalidCell", () => {
  it("1翻20符は常に無効", () => {
    expect(isInvalidCell(1, 20, "ron")).toBe(true);
    expect(isInvalidCell(1, 20, "tsumo")).toBe(true);
  });

  it("ロンで20符は無効（平和ツモ専用）", () => {
    expect(isInvalidCell(2, 20, "ron")).toBe(true);
    expect(isInvalidCell(3, 20, "ron")).toBe(true);
  });

  it("ツモで20符は翻が2以上なら有効", () => {
    expect(isInvalidCell(2, 20, "tsumo")).toBe(false);
    expect(isInvalidCell(3, 20, "tsumo")).toBe(false);
  });

  it("1翻25符は無効（七対子は最低2翻）", () => {
    expect(isInvalidCell(1, 25, "ron")).toBe(true);
    expect(isInvalidCell(1, 25, "tsumo")).toBe(true);
  });

  it("ツモ2翻25符は無効（七対子ツモは符計算不要）", () => {
    expect(isInvalidCell(2, 25, "tsumo")).toBe(true);
  });

  it("ロン2翻25符は有効", () => {
    expect(isInvalidCell(2, 25, "ron")).toBe(false);
  });

  it("通常の組み合わせは有効", () => {
    expect(isInvalidCell(1, 30, "ron")).toBe(false);
    expect(isInvalidCell(2, 30, "tsumo")).toBe(false);
    expect(isInvalidCell(3, 40, "ron")).toBe(false);
    expect(isInvalidCell(4, 30, "tsumo")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { takeToastOnArrival, toastOnArrival } from "./toast-on-arrival";

describe("toastOnArrival", () => {
  it("預けた文言を着地先の pathname で取り出せる", () => {
    toastOnArrival("/practice/jantou-fu", "練習を終了しました");
    expect(takeToastOnArrival("/practice/jantou-fu")).toBe(
      "練習を終了しました",
    );
  });

  it("一度取り出したら空になる（同じページへ戻るたびに再表示しない）", () => {
    toastOnArrival("/practice", "練習を終了しました");
    takeToastOnArrival("/practice");
    expect(takeToastOnArrival("/practice")).toBeNull();
  });

  it("着地先が違えば出さず、預かりも捨てる（後から無関係なページで出さない）", () => {
    toastOnArrival("/practice", "練習を終了しました");
    expect(takeToastOnArrival("/mypage")).toBeNull();
    expect(takeToastOnArrival("/practice")).toBeNull();
  });

  it("href のクエリ・ハッシュは着地判定に使わない", () => {
    toastOnArrival("/practice/score?bakaze=ton#board", "練習を終了しました");
    expect(takeToastOnArrival("/practice/score")).toBe("練習を終了しました");
  });

  it("何も預けていなければ null を返す", () => {
    expect(takeToastOnArrival("/practice")).toBeNull();
  });
});

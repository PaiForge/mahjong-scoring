import { describe, expect, it } from "vitest";
import { listedProblemCount, parseFinishReason } from "../finish-reason";

describe("parseFinishReason", () => {
  it("既知の理由はそのまま返す", () => {
    expect(parseFinishReason("timeUp")).toBe("timeUp");
    expect(parseFinishReason("mistakeLimit")).toBe("mistakeLimit");
  });

  it("付いていない・壊れている値は undefined", () => {
    expect(parseFinishReason(null)).toBeUndefined();
    expect(parseFinishReason(undefined)).toBeUndefined();
    expect(parseFinishReason("")).toBeUndefined();
    expect(parseFinishReason("quit")).toBeUndefined();
    expect(parseFinishReason(["timeUp"])).toBeUndefined();
  });
});

describe("listedProblemCount", () => {
  it("時間切れなら答えられなかった最後の 1 問を足す", () => {
    expect(listedProblemCount(7, "timeUp")).toBe(8);
  });

  it("ミス上限なら答えた問題だけ", () => {
    expect(listedProblemCount(7, "mistakeLimit")).toBe(7);
  });

  it("理由が分からなければ足さない", () => {
    expect(listedProblemCount(7, undefined)).toBe(7);
  });
});

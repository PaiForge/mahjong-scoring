import { describe, expect, it } from "vitest";
import { isSessionRoute } from "./session-routes";

describe("isSessionRoute", () => {
  it.each([
    "/practice/jantou-fu/play",
    "/practice/score/play",
    "/practice/mangan-score-calculation/training",
    "/exam/fu-score/play",
  ])("%s はセッション中とみなす", (pathname) => {
    expect(isSessionRoute(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/practice",
    "/practice/jantou-fu",
    "/practice/jantou-fu/result",
    "/exam/fu-score",
    "/exam/fu-score/result",
    "/learn/jantou-fu",
    // 末尾に階層が続くものは別の画面
    "/practice/jantou-fu/play/detail",
  ])("%s はセッション中とみなさない", (pathname) => {
    expect(isSessionRoute(pathname)).toBe(false);
  });
});

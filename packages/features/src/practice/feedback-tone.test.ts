import { describe, expect, it } from "vitest";

import { choiceFeedbackTone, frameFeedbackTone } from "./feedback-tone";

describe("choiceFeedbackTone", () => {
  it("押した直後・正誤の前は採点待ち", () => {
    expect(choiceFeedbackTone(false, true, false)).toBe("pending");
  });

  it("採点待ちは正誤（isCorrect）によらない", () => {
    expect(choiceFeedbackTone(false, true, true)).toBe("pending");
  });

  it("押していない選択肢は待機", () => {
    expect(choiceFeedbackTone(false, false, false)).toBe("idle");
    expect(choiceFeedbackTone(false, false, true)).toBe("idle");
  });

  it("正解は選んだかどうかに関わらず正解", () => {
    expect(choiceFeedbackTone(true, true, true)).toBe("correct");
    expect(choiceFeedbackTone(true, false, true)).toBe("correct");
  });

  it("選んだ不正解は不正解", () => {
    expect(choiceFeedbackTone(true, true, false)).toBe("wrong");
  });

  it("選ばなかった不正解は薄くする", () => {
    expect(choiceFeedbackTone(true, false, false)).toBe("dimmed");
  });
});

describe("frameFeedbackTone", () => {
  it("正誤の前は既定", () => {
    expect(frameFeedbackTone(false, true)).toBe("idle");
    expect(frameFeedbackTone(false, undefined)).toBe("idle");
    expect(frameFeedbackTone(true, undefined)).toBe("idle");
  });

  it("正解と不正解", () => {
    expect(frameFeedbackTone(true, true)).toBe("correct");
    expect(frameFeedbackTone(true, false)).toBe("wrong");
  });
});

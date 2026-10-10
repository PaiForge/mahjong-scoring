import { describe, expect, it } from "vitest";

import { colors } from "../lib/theme";
import { choiceFeedbackStyle, feedbackFrameStyle } from "./feedback-styles";

describe("choiceFeedbackStyle", () => {
  it("採点待ち（押した直後・正誤の前）は灰で、正解の塗りと別の色", () => {
    const style = choiceFeedbackStyle(false, true, false);
    expect(style).toEqual({
      borderColor: colors.pendingBorder,
      backgroundColor: colors.pending,
    });
    // 正解の塗りと同じ値だと「緑になってから赤に変わる」ように見える
    expect(style.backgroundColor).not.toBe(colors.successSubtle);
  });

  it("採点待ちは正誤（isCorrect）によらず同じ灰", () => {
    expect(choiceFeedbackStyle(false, true, true)).toEqual(
      choiceFeedbackStyle(false, true, false),
    );
  });

  it("押していない選択肢は白", () => {
    expect(choiceFeedbackStyle(false, false, false)).toEqual({
      borderColor: colors.surface300,
      backgroundColor: colors.white,
    });
  });

  it("正解は success の枠と淡い塗り", () => {
    expect(choiceFeedbackStyle(true, true, true)).toEqual({
      borderColor: colors.success,
      backgroundColor: colors.successSubtle,
    });
  });

  it("選ばなかった正解も正解の色で示す", () => {
    expect(choiceFeedbackStyle(true, false, true)).toEqual({
      borderColor: colors.success,
      backgroundColor: colors.successSubtle,
    });
  });

  it("選んだ不正解は destructive の枠と淡い塗り", () => {
    expect(choiceFeedbackStyle(true, true, false)).toEqual({
      borderColor: colors.destructive,
      backgroundColor: colors.destructiveSubtle,
    });
  });

  it("選ばなかった不正解は薄くする", () => {
    expect(choiceFeedbackStyle(true, false, false)).toEqual({
      borderColor: colors.surface300,
      backgroundColor: colors.white,
      opacity: 0.5,
    });
  });
});

describe("feedbackFrameStyle", () => {
  it("正誤の前は淡い枠の白", () => {
    const plain = { borderColor: colors.panel, backgroundColor: colors.white };
    expect(feedbackFrameStyle(false, true)).toEqual(plain);
    expect(feedbackFrameStyle(true, undefined)).toEqual(plain);
  });

  it("正解は success、不正解は destructive", () => {
    expect(feedbackFrameStyle(true, true)).toEqual({
      borderColor: colors.success,
      backgroundColor: colors.successSubtle,
    });
    expect(feedbackFrameStyle(true, false)).toEqual({
      borderColor: colors.destructive,
      backgroundColor: colors.destructiveSubtle,
    });
  });
});

import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  TrainingModeProvider,
  useTrainingAnswerVisibility,
} from "./use-training-mode";

afterEach(cleanup);

describe("useTrainingAnswerVisibility", () => {
  it("チャレンジでは回答後も正解や内訳を開示しない", () => {
    const { result } = renderHook(() => useTrainingAnswerVisibility(false));
    expect(result.current).toEqual({ showAnswer: false, showBreakdown: false });
  });

  it.each([
    [false, false, undefined, false, false],
    [true, false, undefined, true, true],
    [false, true, false, true, true],
    [false, true, true, false, true],
    [true, true, true, false, true],
  ] as const)(
    "開示=%s、停止=%s、正解=%s の表示を決める",
    (isRevealed, isHolding, correct, showAnswer, showBreakdown) => {
      const { result } = renderHook(
        () => useTrainingAnswerVisibility(correct),
        {
          wrapper: ({ children }) => (
            <TrainingModeProvider
              value={{ isRevealed, isHolding, registerAdvance: () => {} }}
            >
              {children}
            </TrainingModeProvider>
          ),
        },
      );
      expect(result.current).toEqual({ showAnswer, showBreakdown });
    },
  );
});

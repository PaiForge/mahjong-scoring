import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePresentQuestion } from "./use-present-question";

interface Question {
  readonly answer: number;
}

/** 問題を回答なしの結果に組む（参照が安定している必要があるためモジュール定数） */
const toUnanswered = (question: Question) => ({
  correct: question.answer,
  outcome: "timeUp" as const,
});

describe("usePresentQuestion", () => {
  it("問題が出るたびに回答なしの結果を届け出る", () => {
    const onPresentQuestion = vi.fn();
    const { rerender } = renderHook(
      ({ question }: { question: Question | undefined }) =>
        usePresentQuestion(question, toUnanswered, onPresentQuestion),
      { initialProps: { question: { answer: 30 } } },
    );

    expect(onPresentQuestion).toHaveBeenLastCalledWith({
      correct: 30,
      outcome: "timeUp",
    });

    rerender({ question: { answer: 40 } });

    expect(onPresentQuestion).toHaveBeenLastCalledWith({
      correct: 40,
      outcome: "timeUp",
    });
  });

  it("問題が生成待ち（undefined）の間は届け出ない", () => {
    const onPresentQuestion = vi.fn();
    renderHook(() =>
      usePresentQuestion(undefined, toUnanswered, onPresentQuestion),
    );
    expect(onPresentQuestion).not.toHaveBeenCalled();
  });

  it("届け先が無い（トレーニング）なら何もしない", () => {
    expect(() =>
      renderHook(() =>
        usePresentQuestion({ answer: 30 }, toUnanswered, undefined),
      ),
    ).not.toThrow();
  });
});

// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useJantouFuBoard } from "./use-jantou-fu-board";

function render() {
  const onAnswer = vi.fn();
  const onRecordResult = vi.fn();
  const view = renderHook(
    ({ showFeedback }) =>
      useJantouFuBoard({
        renfonpaiAs4Fu: false,
        showFeedback,
        onAnswer,
        onRecordResult,
      }),
    { initialProps: { showFeedback: false } },
  );
  return { ...view, onAnswer, onRecordResult };
}

describe("useJantouFuBoard", () => {
  it("出題ホストが無ければ自分で出題し、その場で採点して記録する", () => {
    const { result, onAnswer, onRecordResult } = render();
    const question = result.current.question;
    expect(question).toBeDefined();
    const correctIndex = question!.choices.findIndex((c) => c.isCorrect);

    act(() => result.current.handleSelect(correctIndex));

    expect(result.current.selectedHai).toBe(
      question!.choices[correctIndex].hai,
    );
    expect(onRecordResult).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Function));
  });

  it("次の問題へ進むと選択を解いて問題を差し替える", () => {
    const { result, onAnswer } = render();
    const first = result.current.question;
    act(() => result.current.handleSelect(0));
    const advance = onAnswer.mock.calls[0][1];

    act(() => advance());

    expect(result.current.selectedHai).toBeUndefined();
    expect(result.current.question).not.toBe(first);
  });

  it("答え合わせの表示中は回答を受け付けない", () => {
    const { result, rerender, onAnswer } = render();
    rerender({ showFeedback: true });
    act(() => result.current.handleSelect(0));
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useYakuBoard } from "./use-yaku-board";

function render() {
  const onAnswer = vi.fn();
  const onRecordResult = vi.fn();
  const view = renderHook(() =>
    useYakuBoard({ showFeedback: false, onAnswer, onRecordResult }),
  );
  return { ...view, onAnswer, onRecordResult };
}

describe("useYakuBoard", () => {
  it("役を 1 つも選んでいなければ送らない", () => {
    const { result, onAnswer } = render();
    act(() => result.current.handleSubmit());
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("成立していた役をすべて選んで送ると正解として記録する", () => {
    const { result, onAnswer, onRecordResult } = render();
    const question = result.current.question!;
    for (const name of question.correctYakuNames) {
      act(() => result.current.handleToggleYaku(name));
    }

    act(() => result.current.handleSubmit());

    expect(onRecordResult).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Function));
  });

  it("同じ役をもう一度押すと選択を外す", () => {
    const { result } = render();
    act(() => result.current.handleToggleYaku("立直"));
    act(() => result.current.handleToggleYaku("立直"));
    expect(result.current.selectedYaku.size).toBe(0);
  });

  it("次の問題へ進むと選択を解いて出題番号を進める", () => {
    const { result, onAnswer } = render();
    act(() => result.current.handleToggleYaku("立直"));
    act(() => result.current.handleSubmit());
    act(() => onAnswer.mock.calls[0][1]());
    expect(result.current.selectedYaku.size).toBe(0);
    expect(result.current.questionIndex).toBe(1);
  });
});

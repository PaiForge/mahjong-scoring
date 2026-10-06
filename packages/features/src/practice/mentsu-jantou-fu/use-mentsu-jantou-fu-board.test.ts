// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMentsuJantouFuBoard } from "./use-mentsu-jantou-fu-board";

function render() {
  const onAnswer = vi.fn();
  const onRecordResult = vi.fn();
  const view = renderHook(() =>
    useMentsuJantouFuBoard({
      renfonpaiAs4Fu: false,
      showFeedback: false,
      onAnswer,
      onRecordResult,
    }),
  );
  return { ...view, onAnswer, onRecordResult };
}

describe("useMentsuJantouFuBoard", () => {
  it("全行が埋まるまでは送らず、埋まった時点で採点して記録する", () => {
    const { result, onAnswer, onRecordResult } = render();
    const items = result.current.question!.items;

    items.slice(0, -1).forEach((item, i) => {
      act(() => result.current.handleSelect(i, item.fu));
    });
    expect(onAnswer).not.toHaveBeenCalled();

    act(() => result.current.handleSelect(items.length - 1, items.at(-1)!.fu));

    expect(onRecordResult).toHaveBeenCalledTimes(1);
    expect(onAnswer).toHaveBeenCalledWith(true, expect.any(Function));
  });

  it("選んだ符は行ごとに数値で持つ", () => {
    const { result } = render();
    act(() => result.current.handleSelect(1, 8));
    expect(result.current.answers[1]).toBe(8);
    expect(result.current.answers[0]).toBeUndefined();
  });
});

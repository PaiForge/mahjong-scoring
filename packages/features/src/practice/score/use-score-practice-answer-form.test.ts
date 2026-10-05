// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { UserAnswer } from "@mahjong-scoring/core";
import { describe, expect, it, vi } from "vitest";

import { useScorePracticeAnswerForm } from "./use-score-practice-answer-form";

function render(prefill?: UserAnswer) {
  const onSubmit = vi.fn();
  const view = renderHook(
    ({ prefill: current }: { prefill?: UserAnswer }) =>
      useScorePracticeAnswerForm({
        onSubmit,
        isTsumo: false,
        isOya: false,
        requireYaku: false,
        requireFuForMangan: false,
        kiriageMangan: false,
        allowDoubleYakuman: false,
        prefill: current,
      }),
    { initialProps: { prefill } },
  );
  return { ...view, onSubmit };
}

describe("useScorePracticeAnswerForm", () => {
  it("翻・符・点数が揃ったら送れる", () => {
    const { result, onSubmit } = render();
    act(() => result.current.setHan(2));
    act(() => result.current.setFu(30));
    expect(result.current.isComplete).toBe(false);
    act(() => result.current.setScore(2000));
    expect(result.current.isComplete).toBe(true);

    act(() => result.current.submit());
    expect(onSubmit).toHaveBeenCalledWith({
      han: 2,
      fu: 30,
      score: 2000,
      yakus: [],
    });
  });

  it("満貫以上は符を問わず、送る回答にも符を持たせない", () => {
    const { result, onSubmit } = render();
    act(() => result.current.setHan(5));
    expect(result.current.isFuRequired).toBe(false);
    act(() => result.current.setScore(8000));
    act(() => result.current.submit());
    expect(onSubmit).toHaveBeenCalledWith({
      han: 5,
      fu: undefined,
      score: 8000,
      yakus: [],
    });
  });

  it("触る前は prefill の変化に追従し、触った後は追従しない", () => {
    const { result, rerender } = render();
    rerender({ prefill: { han: 3, fu: 40, score: 5200, yakus: [] } });
    expect(result.current.han).toBe(3);

    act(() => result.current.setHan(1));
    rerender({ prefill: { han: 4, fu: 30, score: 7700, yakus: [] } });
    expect(result.current.han).toBe(1);
  });
});

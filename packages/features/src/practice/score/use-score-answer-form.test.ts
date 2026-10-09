// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  useScoreAnswerForm,
  type UseScoreAnswerFormParams,
} from "./use-score-answer-form";

function render(params: Partial<UseScoreAnswerFormParams> = {}) {
  const onSubmit = vi.fn();
  const view = renderHook(() =>
    useScoreAnswerForm({
      isOya: false,
      isTsumo: false,
      han: 1,
      kiriageMangan: false,
      koTsumoInput: "combined",
      onSubmit,
      ...params,
    }),
  );
  return { ...view, onSubmit };
}

describe("useScoreAnswerForm", () => {
  it("自動送信ではロンの点数を選んだ時点で送る", () => {
    const { result, onSubmit } = render({ autoSubmit: true });
    act(() => result.current.selectScore(1000));
    expect(onSubmit).toHaveBeenCalledWith({ type: "ron", score: 1000 });
    expect(result.current.showsSubmitButton).toBe(false);
  });

  it("子ツモのまとめた select は組を選んだ時点で送る", () => {
    const { result, onSubmit } = render({ isTsumo: true, autoSubmit: true });
    expect(result.current.availableScores.type).toBe("koTsumoCombined");
    act(() =>
      result.current.selectKoTsumoPayment({
        type: "koTsumo",
        fromKo: 300,
        fromOya: 500,
      }),
    );
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      type: "koTsumo",
      fromKo: 300,
      fromOya: 500,
    });
  });

  it("子ツモの分割入力は 2 つとも選ぶまで送らない", () => {
    const { result, onSubmit } = render({
      isTsumo: true,
      autoSubmit: true,
      koTsumoInput: "split",
    });
    act(() => result.current.selectFromKo(300));
    expect(onSubmit).not.toHaveBeenCalled();
    act(() => result.current.selectFromOya(500));
    expect(onSubmit).toHaveBeenCalledWith({
      type: "koTsumo",
      fromKo: 300,
      fromOya: 500,
    });
  });

  it("自動送信でなければボタンで送り、揃うまでは揃っていない扱い", () => {
    const { result, onSubmit } = render({ isOya: true, isTsumo: true });
    expect(result.current.isComplete).toBe(false);
    act(() => result.current.submit());
    expect(onSubmit).not.toHaveBeenCalled();

    act(() => result.current.selectScore(500));
    expect(result.current.isComplete).toBe(true);
    act(() => result.current.submit());
    expect(onSubmit).toHaveBeenCalledWith({ type: "oyaTsumo", all: 500 });
  });

  it("操作不可の間は自動送信しない", () => {
    const { result, onSubmit } = render({ autoSubmit: true, disabled: true });
    act(() => result.current.selectScore(1000));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

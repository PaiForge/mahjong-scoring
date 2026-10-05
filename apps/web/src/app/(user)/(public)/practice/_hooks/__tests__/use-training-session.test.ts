import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTrainingSettingsStore } from "@/app/_hooks/use-training-settings-store";
import { useTrainingSession } from "../use-training-session";

/**
 * web のラッパーが端末ローカルの設定をセッションへ渡していることを固定する。
 * セッションの振る舞いそのものは features の `useTrainingSession` のテストが持つ。
 */
describe("useTrainingSession（web）", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    useTrainingSettingsStore.setState({ autoAdvanceOnCorrect: false });
  });

  it("設定が既定（自動遷移なし）なら正解でも止まる", () => {
    useTrainingSettingsStore.setState({ autoAdvanceOnCorrect: false });
    const onNext = vi.fn();
    const { result } = renderHook(() => useTrainingSession());

    act(() => result.current.handleAnswer(true, onNext));
    act(() => vi.advanceTimersByTime(10_000));

    expect(onNext).not.toHaveBeenCalled();
    expect(result.current.isHolding).toBe(true);
  });

  it("設定で自動遷移を有効にすると正解は自動で次へ進む", () => {
    useTrainingSettingsStore.setState({ autoAdvanceOnCorrect: true });
    const onNext = vi.fn();
    const { result } = renderHook(() => useTrainingSession());

    act(() => result.current.handleAnswer(true, onNext));
    act(() => vi.advanceTimersByTime(800));

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

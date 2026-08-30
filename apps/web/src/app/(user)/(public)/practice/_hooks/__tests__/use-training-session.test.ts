import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTrainingSettingsStore } from "@/app/_hooks/use-training-settings-store";
import { useTrainingSession } from "../use-training-session";

describe("useTrainingSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTrainingSettingsStore.setState({ autoAdvanceOnCorrect: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("正解・不正解を集計する", () => {
    const { result } = renderHook(() => useTrainingSession());

    act(() => result.current.handleAnswer(true, () => {}));
    act(() => result.current.proceed());
    act(() => result.current.handleAnswer(false, () => {}));
    act(() => result.current.proceed());

    expect(result.current.correctCount).toBe(1);
    expect(result.current.totalCount).toBe(2);
  });

  describe("reveal", () => {
    it("正解開示中は時間が経っても進まず、proceed で進む", () => {
      const onNext = vi.fn();
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.reveal(onNext));
      act(() => vi.advanceTimersByTime(10_000));

      // 正解を読む時間を確保するため、開示したまま止まる
      expect(onNext).not.toHaveBeenCalled();
      expect(result.current.showFeedback).toBe(true);
      expect(result.current.isRevealed).toBe(true);
      // 開示は回答後の停止とは別の状態（盤面の回答ボタンは残す）
      expect(result.current.isHolding).toBe(false);
      expect(result.current.lastAnswerCorrect).toBeUndefined();

      act(() => result.current.proceed());

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(result.current.showFeedback).toBe(false);
      expect(result.current.isRevealed).toBe(false);
    });

    it("開示は回答ではないため正解数・出題数に含めない", () => {
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.reveal(() => {}));
      act(() => result.current.proceed());

      expect(result.current.correctCount).toBe(0);
      expect(result.current.totalCount).toBe(0);
    });

    it("フィードバック表示中の reveal は無視する", () => {
      const onNext = vi.fn();
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.handleAnswer(true, () => {}));
      act(() => result.current.reveal(onNext));

      expect(result.current.isRevealed).toBe(false);

      act(() => result.current.proceed());

      expect(onNext).not.toHaveBeenCalled();
    });

    it("開示中の handleAnswer は無視する", () => {
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.reveal(() => {}));
      act(() => result.current.handleAnswer(true, () => {}));

      expect(result.current.totalCount).toBe(0);
      expect(result.current.lastAnswerCorrect).toBeUndefined();
    });
  });

  describe("回答後の停止", () => {
    it("不正解では時間が経っても進まず、proceed で進む", () => {
      const onNext = vi.fn();
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.handleAnswer(false, onNext));
      act(() => vi.advanceTimersByTime(10_000));

      // 解説を読む時間を確保するため、フィードバックを出したまま止まる
      expect(onNext).not.toHaveBeenCalled();
      expect(result.current.showFeedback).toBe(true);
      expect(result.current.isHolding).toBe(true);
      expect(result.current.lastAnswerCorrect).toBe(false);

      act(() => result.current.proceed());

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(result.current.showFeedback).toBe(false);
      expect(result.current.isHolding).toBe(false);
      expect(result.current.lastAnswerCorrect).toBeUndefined();
    });

    it("正解でも時間が経っても進まず、proceed で進む", () => {
      const onNext = vi.fn();
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.handleAnswer(true, onNext));
      act(() => vi.advanceTimersByTime(10_000));

      // 合っていた根拠（符の内訳・符目ごとの正解）を確認する時間を確保する
      expect(onNext).not.toHaveBeenCalled();
      expect(result.current.showFeedback).toBe(true);
      expect(result.current.lastAnswerCorrect).toBe(true);

      act(() => result.current.proceed());

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(result.current.showFeedback).toBe(false);
      expect(result.current.lastAnswerCorrect).toBeUndefined();
    });

    it("停止中の proceed は一度しか効かない", () => {
      const onNext = vi.fn();
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.handleAnswer(false, onNext));
      act(() => result.current.proceed());
      act(() => result.current.proceed());

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it("停止していないときの proceed は何もしない", () => {
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.proceed());

      expect(result.current.totalCount).toBe(0);
      expect(result.current.showFeedback).toBe(false);
    });
  });

  describe("正解時の自動遷移設定", () => {
    beforeEach(() => {
      useTrainingSettingsStore.setState({ autoAdvanceOnCorrect: true });
    });

    it("正解はフィードバックのあと自動で次問題へ進む", () => {
      const onNext = vi.fn();
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.handleAnswer(true, onNext));

      // 押す操作が無いので「次の問題へ」は出さない
      expect(result.current.isHolding).toBe(false);
      expect(result.current.showFeedback).toBe(true);
      expect(onNext).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(800));

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(result.current.showFeedback).toBe(false);
      expect(result.current.lastAnswerCorrect).toBeUndefined();
    });

    it("不正解は設定に関わらず止まる（答え合わせのため）", () => {
      const onNext = vi.fn();
      const { result } = renderHook(() => useTrainingSession());

      act(() => result.current.handleAnswer(false, onNext));
      act(() => vi.advanceTimersByTime(10_000));

      expect(onNext).not.toHaveBeenCalled();
      expect(result.current.isHolding).toBe(true);

      act(() => result.current.proceed());

      expect(onNext).toHaveBeenCalledTimes(1);
      expect(result.current.isHolding).toBe(false);
    });
  });
});

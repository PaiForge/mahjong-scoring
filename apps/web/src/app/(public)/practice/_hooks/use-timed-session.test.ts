import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimedSession } from "./use-timed-session";

/**
 * useTimedSession のポーズ機能テスト
 *
 * useCountdown は内部で setTimeout を使うため、
 * vi.useFakeTimers() でタイマーを制御し、カウントダウンを完了させてから
 * ポーズ関連のテストを行う。
 */

/** カウントダウンを完了させるヘルパー（countdownFrom 秒分進める） */
function completeCountdown(countdownFrom = 3) {
  for (let i = 0; i < countdownFrom; i++) {
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }
}

describe("useTimedSession - pause feature", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isPaused の初期状態", () => {
    it("isPaused の初期値は false", () => {
      const { result } = renderHook(() => useTimedSession());
      expect(result.current.gameSession.isPaused).toBe(false);
    });
  });

  describe("togglePause の基本動作", () => {
    it("togglePause で isPaused が true にトグルされる", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      act(() => {
        result.current.gameSession.togglePause();
      });

      expect(result.current.gameSession.isPaused).toBe(true);
    });

    it("togglePause を2回呼ぶと isPaused が false に戻る", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      act(() => {
        result.current.gameSession.togglePause();
      });
      act(() => {
        result.current.gameSession.togglePause();
      });

      expect(result.current.gameSession.isPaused).toBe(false);
    });

    it("ポーズ → 解除 → 再度ポーズの繰り返しが正しく動作する", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      // 1回目: pause
      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.gameSession.isPaused).toBe(true);

      // 1回目: resume
      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.gameSession.isPaused).toBe(false);

      // 2回目: pause
      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.gameSession.isPaused).toBe(true);

      // 2回目: resume
      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.gameSession.isPaused).toBe(false);

      // 3回目: pause
      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.gameSession.isPaused).toBe(true);
    });
  });

  describe("togglePause が無効になるケース", () => {
    it("カウントダウン中は togglePause が無効", () => {
      const { result } = renderHook(() => useTimedSession());

      // カウントダウン中であることを確認
      expect(result.current.gameSession.isCountingDown).toBe(true);

      act(() => {
        result.current.gameSession.togglePause();
      });

      expect(result.current.gameSession.isPaused).toBe(false);
    });

    it("isFinished 時は togglePause が無効", () => {
      const { result } = renderHook(() =>
        useTimedSession({ mistakeLimit: 1, feedbackDurationMs: 0 })
      );
      completeCountdown();

      // ミスして終了させる
      const onNext = vi.fn();
      act(() => {
        result.current.gameSession.handleAnswer(false, onNext);
      });
      // feedbackDurationMs=0 でも setTimeout(fn, 0) なので進める
      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current.gameSession.isFinished).toBe(true);

      // 終了後に togglePause しても isPaused は変わらない
      act(() => {
        result.current.gameSession.togglePause();
      });

      expect(result.current.gameSession.isPaused).toBe(false);
    });
  });

  describe("ポーズ中の handleAnswer", () => {
    it("isPaused=true 時に handleAnswer が無視される", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      // ポーズにする
      act(() => {
        result.current.gameSession.togglePause();
      });

      const onNext = vi.fn();

      // ポーズ中に回答を試みる
      act(() => {
        result.current.gameSession.handleAnswer(true, onNext);
      });

      expect(result.current.gameSession.correctCount).toBe(0);
      expect(result.current.gameSession.totalCount).toBe(0);
      expect(onNext).not.toHaveBeenCalled();
    });

    it("ポーズ解除後は handleAnswer が正常に動作する", () => {
      const { result } = renderHook(() =>
        useTimedSession({ feedbackDurationMs: 100 })
      );
      completeCountdown();

      // ポーズ → 解除
      act(() => {
        result.current.gameSession.togglePause();
      });
      act(() => {
        result.current.gameSession.togglePause();
      });

      const onNext = vi.fn();
      act(() => {
        result.current.gameSession.handleAnswer(true, onNext);
      });

      expect(result.current.gameSession.correctCount).toBe(1);

      // フィードバック完了を待つ
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(onNext).toHaveBeenCalledOnce();
    });
  });

  describe("ポーズ中の timerControl", () => {
    it("isPaused=true 時に timerControl.isActive が false になる", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      // プレイ中は isActive が true
      expect(result.current.timerControl.isActive).toBe(true);

      act(() => {
        result.current.gameSession.togglePause();
      });

      expect(result.current.timerControl.isActive).toBe(false);
    });

    it("ポーズ解除で timerControl.isActive が true に戻る", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.timerControl.isActive).toBe(false);

      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.timerControl.isActive).toBe(true);
    });
  });

  describe("ポーズ中の gameSession.isPlaying", () => {
    it("isPaused=true 時に gameSession.isPlaying が false になる", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      expect(result.current.gameSession.isPlaying).toBe(true);

      act(() => {
        result.current.gameSession.togglePause();
      });

      expect(result.current.gameSession.isPlaying).toBe(false);
    });

    it("ポーズ解除で gameSession.isPlaying が true に戻る", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.gameSession.isPlaying).toBe(false);

      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.gameSession.isPlaying).toBe(true);
    });
  });

  describe("reset によるポーズ状態のリセット", () => {
    it("reset() で isPaused が false にリセットされる", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.gameSession.isPaused).toBe(true);

      act(() => {
        result.current.timerControl.reset();
      });

      expect(result.current.gameSession.isPaused).toBe(false);
    });

    it("reset() 後にカウントダウンが再開される", () => {
      const { result } = renderHook(() => useTimedSession());
      completeCountdown();

      act(() => {
        result.current.gameSession.togglePause();
      });

      act(() => {
        result.current.timerControl.reset();
      });

      // リセット後はカウントダウン状態に戻る
      expect(result.current.gameSession.isCountingDown).toBe(true);
      expect(result.current.gameSession.isPaused).toBe(false);
    });
  });

  describe("フィードバック表示中のポーズ", () => {
    it("フィードバック表示中でもポーズのトグルが可能", () => {
      const { result } = renderHook(() =>
        useTimedSession({ feedbackDurationMs: 5000 })
      );
      completeCountdown();

      const onNext = vi.fn();
      act(() => {
        result.current.gameSession.handleAnswer(true, onNext);
      });

      expect(result.current.gameSession.showFeedback).toBe(true);

      // フィードバック中にポーズ
      act(() => {
        result.current.gameSession.togglePause();
      });

      expect(result.current.gameSession.isPaused).toBe(true);
    });
  });

  describe("ポーズ中にタイマーが進まないことの検証", () => {
    it("ポーズ中は timerControl.isActive が false のままであり続ける", () => {
      const { result } = renderHook(() => useTimedSession({ timeLimit: 5 }));
      completeCountdown();

      expect(result.current.timerControl.isActive).toBe(true);

      act(() => {
        result.current.gameSession.togglePause();
      });
      expect(result.current.timerControl.isActive).toBe(false);

      // 時間を大きく進めても isActive は false のまま
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(result.current.timerControl.isActive).toBe(false);
      expect(result.current.gameSession.isFinished).toBe(false);
    });
  });
});

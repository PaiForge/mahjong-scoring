// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { GameSessionState } from "./use-timed-session";
import { useQuitPause } from "./use-quit-pause";

/** 一時停止の判定に効く項目だけを持つセッション */
function session(
  state: Pick<GameSessionState, "isPaused" | "isCountingDown">,
): GameSessionState {
  return { ...state, togglePause: vi.fn() } as unknown as GameSessionState;
}

describe("useQuitPause", () => {
  it("動いていれば開いたときに止め、キャンセルで再開する", () => {
    const running = session({ isPaused: false, isCountingDown: false });
    const { result, rerender } = renderHook(
      ({ current }) => useQuitPause(current),
      { initialProps: { current: running } },
    );
    result.current.pauseForQuit();
    expect(running.togglePause).toHaveBeenCalledTimes(1);

    const paused = session({ isPaused: true, isCountingDown: false });
    rerender({ current: paused });
    result.current.resumeAfterQuit();
    expect(paused.togglePause).toHaveBeenCalledTimes(1);
  });

  it("開く前から止めていたら、閉じても止めたままにする", () => {
    const paused = session({ isPaused: true, isCountingDown: false });
    const { result } = renderHook(() => useQuitPause(paused));
    result.current.pauseForQuit();
    result.current.resumeAfterQuit();
    expect(paused.togglePause).not.toHaveBeenCalled();
  });

  it("カウントダウン中に開いたら、閉じたときに逆に止めない", () => {
    const counting = session({ isPaused: false, isCountingDown: true });
    const { result, rerender } = renderHook(
      ({ current }) => useQuitPause(current),
      { initialProps: { current: counting } },
    );
    result.current.pauseForQuit();
    expect(counting.togglePause).not.toHaveBeenCalled();

    const running = session({ isPaused: false, isCountingDown: false });
    rerender({ current: running });
    result.current.resumeAfterQuit();
    expect(running.togglePause).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameTimer } from "./use-game-timer";

/**
 * useGameTimer の合わせ直し（sync）のテスト
 *
 * サーバー採点のチャレンジは、応答のたびにサーバーの経過時間へ盤面の
 * 時計を合わせ直す。止めている間の待ち時間が数えられないこと、合わせた
 * 値から数え直すこと、終了後は戻さないことを確認する。
 */
describe("useGameTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mount(initialActive = true) {
    const onTimeLimitReached = vi.fn();
    const hook = renderHook(
      ({ isActive }: { isActive: boolean }) =>
        useGameTimer({ timeLimit: 10, onTimeLimitReached, isActive }),
      { initialProps: { isActive: initialActive } },
    );
    return { ...hook, onTimeLimitReached };
  }

  it("止めている間は進まず、再開すると止めた所から数える", () => {
    const { result, rerender } = mount();
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.elapsedMs).toBe(1000);

    rerender({ isActive: false });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.elapsedMs).toBe(1000);

    rerender({ isActive: true });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.elapsedMs).toBe(2000);
  });

  it("sync で合わせた値から、今を起点に数え直す", () => {
    const { result } = mount();
    act(() => vi.advanceTimersByTime(1000));

    act(() => result.current.sync(3000));
    expect(result.current.elapsedMs).toBe(3000);

    act(() => vi.advanceTimersByTime(500));
    expect(result.current.elapsedMs).toBe(3500);
  });

  it("止めている間に sync した値は、再開したときの起点になる", () => {
    const { result, rerender } = mount();
    act(() => vi.advanceTimersByTime(1000));
    rerender({ isActive: false });

    act(() => result.current.sync(2000));
    expect(result.current.elapsedMs).toBe(2000);

    rerender({ isActive: true });
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.elapsedMs).toBe(3000);
  });

  it("制限時間を超える値に合わせると、次の tick で終了を通知する", () => {
    const { result, onTimeLimitReached } = mount();
    act(() => result.current.sync(10_000));
    act(() => vi.advanceTimersByTime(100));
    expect(onTimeLimitReached).toHaveBeenCalledTimes(1);
  });

  it("終了を通知した後は sync で戻さない", () => {
    const { result, onTimeLimitReached } = mount();
    act(() => vi.advanceTimersByTime(10_000));
    expect(onTimeLimitReached).toHaveBeenCalledTimes(1);

    act(() => result.current.sync(5000));
    expect(result.current.remainingMs).toBe(0);
  });
});

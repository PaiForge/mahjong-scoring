import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { completeCountdown } from "./__tests__/timer-helpers";
import { useTimedSession } from "./use-timed-session";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";

/**
 * 回答ボタンは盤面下端にあるため、縦に長い練習では押した位置のままだと
 * 正誤表示も次の問題も画面外に残る。jsdom はレイアウトを持たないので、
 * スクロール先が練習セッションのアンカーであることだけを検証する。
 *
 * スクロールは React のコミット（フォーカス復元）より後に始めるため次フレームまで
 * 遅らせている。フレームを進めてから検証すること。
 */
describe("useTimedSession 出題の先頭へのスクロール", () => {
  let anchor: HTMLElement;
  let scrollIntoView: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    anchor = document.createElement("div");
    anchor.id = PRACTICE_SCROLL_ANCHOR_ID;
    document.body.appendChild(anchor);
    scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    scrollIntoView.mockRestore();
    anchor.remove();
    vi.useRealTimers();
  });

  it("回答すると練習セッションの先頭へ戻す", () => {
    const { result } = renderHook(() => useTimedSession());
    completeCountdown();

    act(() => {
      result.current.gameSession.handleAnswer(true, () => {});
      vi.advanceTimersToNextFrame();
    });

    expect(scrollIntoView.mock.instances).toContain(anchor);
  });

  it("受け付けない回答（フィードバック表示中）では戻さない", () => {
    const { result } = renderHook(() => useTimedSession());
    completeCountdown();

    act(() => {
      result.current.gameSession.handleAnswer(true, () => {});
      vi.advanceTimersToNextFrame();
    });
    scrollIntoView.mockClear();
    act(() => {
      result.current.gameSession.handleAnswer(true, () => {});
      vi.advanceTimersToNextFrame();
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

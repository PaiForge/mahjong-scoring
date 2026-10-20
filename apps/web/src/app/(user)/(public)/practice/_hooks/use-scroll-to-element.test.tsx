import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode } from "react";
import { renderHook, act } from "@testing-library/react";
import { useScrollToElement } from "./use-scroll-to-element";

const ELEMENT_ID = "scroll-target";

/**
 * jsdom はレイアウトを持たないので、対象要素へ scrollIntoView が呼ばれたか
 * だけを検証する。本題は 2 つ — 描画を待たずにマウントの時点で送ること
 * （待つとスケルトンが送る前の位置で一度描かれる）と、Next の遷移時の
 * スクロールに戻されたぶんを次のフレームで送り直すこと。
 */
describe("useScrollToElement", () => {
  let target: HTMLElement;
  let scrollIntoView: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    target = document.createElement("div");
    target.id = ELEMENT_ID;
    document.body.appendChild(target);
    scrollIntoView = vi
      .spyOn(Element.prototype, "scrollIntoView")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    scrollIntoView.mockRestore();
    target.remove();
    vi.useRealTimers();
  });

  function flushFrame() {
    act(() => {
      vi.advanceTimersToNextFrame();
    });
  }

  it("マウントした時点で、タイマーを待たずに対象要素へスクロールする", () => {
    renderHook(() => useScrollToElement(ELEMENT_ID));

    expect(scrollIntoView.mock.instances).toContain(target);
  });

  it("次のフレームでもう一度スクロールする", () => {
    renderHook(() => useScrollToElement(ELEMENT_ID));
    scrollIntoView.mockClear();

    flushFrame();

    expect(scrollIntoView.mock.instances).toContain(target);
  });

  it("StrictMode でも次のフレームのスクロールが残る", () => {
    renderHook(() => useScrollToElement(ELEMENT_ID), { wrapper: StrictMode });
    scrollIntoView.mockClear();

    flushFrame();

    expect(scrollIntoView.mock.instances).toContain(target);
  });

  it("対象の要素が無ければ何もしない", () => {
    renderHook(() => useScrollToElement("missing-target"));
    flushFrame();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("次のフレームより前にアンマウントしたら送り直さない", () => {
    // Suspense のフォールバックが本体に差し替わるときに通る経路。予約した
    // フレームを残すと、消えた側のスクロールが本体の描画後に走る
    const { unmount } = renderHook(() => useScrollToElement(ELEMENT_ID));
    scrollIntoView.mockClear();

    unmount();
    flushFrame();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("再レンダリングでは繰り返しスクロールしない", () => {
    const { rerender } = renderHook(() => useScrollToElement(ELEMENT_ID));
    flushFrame();
    scrollIntoView.mockClear();

    rerender();
    flushFrame();

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

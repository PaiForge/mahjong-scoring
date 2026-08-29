import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode } from "react";
import { renderHook, act } from "@testing-library/react";
import { useScrollToElement } from "./use-scroll-to-element";

const ELEMENT_ID = "scroll-target";

/**
 * jsdom はレイアウトを持たないので、対象要素へ scrollIntoView が呼ばれたか
 * だけを検証する。StrictMode 下でも効くことが本題（マウント直後に effect を
 * 一度捨てて呼び直す挙動で、以前は一度もスクロールしなくなっていた）。
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

  it("マウント後に対象要素へスクロールする", () => {
    renderHook(() => useScrollToElement(ELEMENT_ID));
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(scrollIntoView.mock.instances).toContain(target);
  });

  it("StrictMode でもスクロールする", () => {
    renderHook(() => useScrollToElement(ELEMENT_ID), { wrapper: StrictMode });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(scrollIntoView.mock.instances).toContain(target);
  });

  it("再レンダリングでは繰り返しスクロールしない", () => {
    const { rerender } = renderHook(() => useScrollToElement(ELEMENT_ID));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    scrollIntoView.mockClear();

    rerender();
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("enabled が false の間はスクロールせず、true になってからスクロールする", () => {
    const { rerender } = renderHook(
      ({ enabled }) => useScrollToElement(ELEMENT_ID, enabled),
      { initialProps: { enabled: false } },
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender({ enabled: true });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(scrollIntoView.mock.instances).toContain(target);
  });
});

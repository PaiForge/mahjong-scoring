/**
 * ScrollReset の遷移時スクロールテスト
 *
 * @description
 * - 初回マウント: スクロールしない（リロード時の位置復元・直リンクのハッシュ着地を潰さない）
 * - パスが変わったとき: 先頭へ戻す
 * - ハッシュ付き遷移: スクロールしない（行き先が指定されている）
 * - 戻る / 進む: スクロールしない（履歴の復元に任せる）
 * - 履歴移動の次の遷移: 通常どおり先頭へ戻す（見分けの状態を持ち越さない）
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

import { setPathname } from "@/test/navigation-mock";

import { ScrollReset } from "./scroll-reset";

const scrollTo = vi.fn();

/** 履歴移動（戻る / 進む）で `pathname` へ着いたことにする */
function goBackTo(pathname: string) {
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

beforeEach(() => {
  vi.stubGlobal("scrollTo", scrollTo);
  window.history.replaceState({}, "", "/practice");
  setPathname("/practice");
});

afterEach(() => {
  scrollTo.mockClear();
  vi.unstubAllGlobals();
  cleanup();
});

describe("ScrollReset", () => {
  it("初回マウントではスクロールしない", () => {
    render(<ScrollReset />);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("パスが変わったら先頭へ戻す", () => {
    const { rerender } = render(<ScrollReset />);

    setPathname("/learn");
    rerender(<ScrollReset />);

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  });

  it("ハッシュ付きの遷移ではスクロールしない", () => {
    const { rerender } = render(<ScrollReset />);

    window.history.pushState(
      {},
      "",
      "/practice/jantou-fu/play#practice-session",
    );
    setPathname("/practice/jantou-fu/play");
    rerender(<ScrollReset />);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("戻る / 進むではスクロールしない", () => {
    const { rerender } = render(<ScrollReset />);

    goBackTo("/learn");
    setPathname("/learn");
    rerender(<ScrollReset />);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("履歴移動の次の遷移は先頭へ戻す", () => {
    const { rerender } = render(<ScrollReset />);

    goBackTo("/learn");
    setPathname("/learn");
    rerender(<ScrollReset />);

    window.history.pushState({}, "", "/dojo");
    setPathname("/dojo");
    rerender(<ScrollReset />);

    expect(scrollTo).toHaveBeenCalledTimes(1);
  });
});

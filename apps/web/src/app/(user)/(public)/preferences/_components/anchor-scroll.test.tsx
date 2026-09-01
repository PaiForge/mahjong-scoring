/**
 * AnchorScroll のハッシュ着地テスト
 *
 * @description
 * - ハッシュ付きで開いたとき: 対象 id の要素へ scrollIntoView する
 * - ハッシュ無しで開いたとき: スクロールしない
 * - 対象 id が存在しないとき: 何もしない（例外を出さない）
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { AnchorScroll } from "./anchor-scroll";

const scrollIntoView = vi.fn();

beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  scrollIntoView.mockClear();
  window.location.hash = "";
  cleanup();
});

describe("AnchorScroll", () => {
  it("ハッシュの id を持つ要素へスクロールする", () => {
    window.location.hash = "#term-links";
    render(
      <>
        <div id="term-links" />
        <AnchorScroll />
      </>,
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("ハッシュが無ければスクロールしない", () => {
    render(
      <>
        <div id="term-links" />
        <AnchorScroll />
      </>,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("対象 id が無ければ何もしない", () => {
    window.location.hash = "#unknown";
    expect(() => render(<AnchorScroll />)).not.toThrow();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

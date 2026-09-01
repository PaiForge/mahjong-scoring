/**
 * AnchorScroll のハッシュ着地テスト
 *
 * @description
 * - ログイン済み・ハッシュ付きで開いたとき: 対象 id の要素へ scrollIntoView する
 * - ハッシュ無しで開いたとき: スクロールしない
 * - 対象 id が存在しないとき: 何もしない（例外を出さない）
 * - 未ログイン: 設定を操作できないのでスクロールせず素の遷移に落とす
 * - 認証状態の確定前: まだスクロールしない（未ログインと区別が付かないため）
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock("@/app/_contexts/auth-context", () => ({ useAuth: mockUseAuth }));

import { AnchorScroll } from "./anchor-scroll";

const scrollIntoView = vi.fn();

/** ログイン済みで認証状態が確定している状態 */
function signedIn() {
  mockUseAuth.mockReturnValue({ user: { id: "u1" }, isLoading: false });
}

beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
  signedIn();
});

afterEach(() => {
  scrollIntoView.mockClear();
  mockUseAuth.mockReset();
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

  it("未ログインならスクロールしない", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    window.location.hash = "#term-links";
    render(
      <>
        <div id="term-links" />
        <AnchorScroll />
      </>,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("認証状態の確定前はスクロールせず、確定後にスクロールする", () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    window.location.hash = "#term-links";
    const { rerender } = render(
      <>
        <div id="term-links" />
        <AnchorScroll />
      </>,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();

    signedIn();
    rerender(
      <>
        <div id="term-links" />
        <AnchorScroll />
      </>,
    );
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});

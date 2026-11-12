import { describe, expect, it } from "vitest";

import { isAccountHref, trailingModalCount } from "./modal-routes";

const routes = (...names: string[]) => names.map((name) => ({ name }));

describe("trailingModalCount", () => {
  it("いちばん上が通常の画面なら 0", () => {
    expect(
      trailingModalCount(routes("(tabs)", "practice/[slug]/index"), 1),
    ).toBe(0);
  });

  it("いちばん上から下へ連なるモーダルだけを数える", () => {
    expect(
      trailingModalCount(
        routes(
          "(tabs)",
          "(session)",
          "practice/[slug]/index",
          "(account)",
          "reference/glossary/[slug]",
        ),
        4,
      ),
    ).toBe(2);
  });

  it("全部がモーダルなら全部を数える（ディープリンクで直接開いたとき）", () => {
    expect(
      trailingModalCount(routes("(account)", "announcements/[slug]"), 1),
    ).toBe(2);
  });

  it("今見えている位置より上（先読み等）は数えない", () => {
    expect(trailingModalCount(routes("(tabs)", "(session)"), 0)).toBe(0);
  });

  it("空の列は 0", () => {
    expect(trailingModalCount([], -1)).toBe(0);
  });
});

describe("isAccountHref", () => {
  it("アカウントの画面とその下のパスは真", () => {
    expect(isAccountHref("/mypage")).toBe(true);
    expect(isAccountHref("/mypage/account/delete")).toBe(true);
    expect(isAccountHref("/preferences/yaku-order")).toBe(true);
    expect(isAccountHref("/sign-in?redirect=%2Fdojo")).toBe(true);
    expect(isAccountHref("/sign-up/verify-email")).toBe(true);
    expect(isAccountHref("/forgot-password")).toBe(true);
    expect(isAccountHref("/leaderboard/jantou-fu#top")).toBe(true);
  });

  it("それ以外と、名前の先頭だけが同じパスは偽", () => {
    expect(isAccountHref("/")).toBe(false);
    expect(isAccountHref("/practice/jantou-fu")).toBe(false);
    expect(isAccountHref("/mypage-x")).toBe(false);
    expect(isAccountHref("/dojo/ranks/kyu-5")).toBe(false);
  });
});

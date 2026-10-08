import { describe, expect, it } from "vitest";

import { SCROLL_EDGE_MARGIN, scrollTargetY } from "./scroll-target";

const VIEWPORT = 500;

describe("scrollTargetY", () => {
  it("center は要素の中央を枠の中央へ", () => {
    expect(scrollTargetY("center", { y: 1000, height: 100 }, VIEWPORT, 0)).toBe(
      800,
    );
  });

  it("start は要素の上端を枠の上端の少し下へ", () => {
    expect(scrollTargetY("start", { y: 1000, height: 100 }, VIEWPORT, 0)).toBe(
      1000 - SCROLL_EDGE_MARGIN,
    );
  });

  it("先頭より前には戻さない", () => {
    expect(scrollTargetY("start", { y: 4, height: 100 }, VIEWPORT, 0)).toBe(0);
  });

  it("nearest は収まっていれば動かさない", () => {
    expect(
      scrollTargetY("nearest", { y: 300, height: 60 }, VIEWPORT, 0),
    ).toBeUndefined();
  });

  it("nearest は下にはみ出した要素の下端を枠の下端へ", () => {
    expect(scrollTargetY("nearest", { y: 600, height: 60 }, VIEWPORT, 0)).toBe(
      600 + 60 + SCROLL_EDGE_MARGIN - VIEWPORT,
    );
  });

  it("nearest は上にはみ出した要素の上端を枠の上端へ", () => {
    expect(
      scrollTargetY("nearest", { y: 100, height: 60 }, VIEWPORT, 400),
    ).toBe(100 - SCROLL_EDGE_MARGIN);
  });

  it("nearest は枠より高い要素なら上端を見せる", () => {
    expect(scrollTargetY("nearest", { y: 600, height: 800 }, VIEWPORT, 0)).toBe(
      600 - SCROLL_EDGE_MARGIN,
    );
  });
});

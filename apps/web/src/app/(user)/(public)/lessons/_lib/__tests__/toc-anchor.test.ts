import { describe, expect, it } from "vitest";

import { chapterTocAnchorId, chapterTocHref } from "../toc-anchor";

describe("toc-anchor", () => {
  it("目次の章の行の id と、その位置へ着地するパスが一致する", () => {
    expect(chapterTocAnchorId("mangan-ko-ron")).toBe("chapter-mangan-ko-ron");
    expect(chapterTocHref("mangan-ko-ron")).toBe(
      "/lessons#chapter-mangan-ko-ron",
    );
  });
});

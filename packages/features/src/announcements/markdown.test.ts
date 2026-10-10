import { describe, expect, it } from "vitest";

import { parseAnnouncementMarkdown } from "./markdown";

describe("parseAnnouncementMarkdown", () => {
  it("先頭の h1 を取り除き、残りの節点を順に残す", () => {
    const tree = parseAnnouncementMarkdown("# タイトル\n\n本文\n\n## 見出し");
    expect(tree.children.map((node) => node.type)).toEqual([
      "paragraph",
      "heading",
    ]);
  });

  it("h1 が先頭に無くても最初の h1 だけを取り除く", () => {
    const tree = parseAnnouncementMarkdown("前置き\n\n# 1 つ目\n\n# 2 つ目");
    expect(tree.children.map((node) => node.type)).toEqual([
      "paragraph",
      "heading",
    ]);
  });

  it("h1 が無ければそのまま", () => {
    const tree = parseAnnouncementMarkdown("## 見出し\n\n本文");
    expect(tree.children).toHaveLength(2);
  });

  it("web と同じく GFM の表と打ち消し線を読む", () => {
    const tree = parseAnnouncementMarkdown(
      "| 列 |\n| --- |\n| 値 |\n\n~~消す~~",
    );
    expect(tree.children[0]?.type).toBe("table");
    const paragraph = tree.children[1];
    expect(
      paragraph?.type === "paragraph" ? paragraph.children[0]?.type : undefined,
    ).toBe("delete");
  });

  it("URL だけの文字をリンクにする（GFM の自動リンク）", () => {
    const tree = parseAnnouncementMarkdown("https://example.com を見る");
    const paragraph = tree.children[0];
    expect(
      paragraph?.type === "paragraph" ? paragraph.children[0]?.type : undefined,
    ).toBe("link");
  });
});

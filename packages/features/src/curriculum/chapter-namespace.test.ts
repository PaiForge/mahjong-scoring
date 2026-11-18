import { describe, expect, it } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";

import { chapterNamespace } from "./chapter-namespace";
import { CURRICULUM_CHAPTER_SLUGS } from "./registry";

describe("chapterNamespace", () => {
  it("ハイフン区切りの slug を camelCase にして .learn を付ける", () => {
    expect(chapterNamespace("jantou-fu")).toBe("jantouFu.learn");
  });

  it("区切りが複数あっても各語の頭を大文字にする", () => {
    expect(chapterNamespace("mangan-ko-ron")).toBe("manganKoRon.learn");
  });

  it("区切りの無い slug はそのまま名前空間になる", () => {
    expect(chapterNamespace("yaku")).toBe("yaku.learn");
  });

  it("どの章の名前空間も日本語の辞書にある", () => {
    for (const slug of CURRICULUM_CHAPTER_SLUGS) {
      const [root, child] = chapterNamespace(slug).split(".");
      expect(messages, slug).toHaveProperty([root, child]);
    }
  });
});

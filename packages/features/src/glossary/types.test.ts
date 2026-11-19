import { describe, expect, it } from "vitest";
import { HaiKind } from "@mahjong-scoring/core";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

import { exampleMinkou } from "../board/example-mentsu";
import { GLOSSARY_TERMS } from "./registry";
import { GLOSSARY_CATEGORIES, isMentsuExample } from "./types";

describe("GLOSSARY_CATEGORIES", () => {
  it("分類は重複しない", () => {
    expect(new Set(GLOSSARY_CATEGORIES).size).toBe(GLOSSARY_CATEGORIES.length);
  });

  it("どの分類にも辞書の見出し（glossary.categories）がある", () => {
    for (const category of GLOSSARY_CATEGORIES) {
      expect(jaMessages.glossary.categories, category).toHaveProperty(category);
    }
  });

  it("用語が使う分類と過不足なく一致する（空の分類も、分類の無い用語も無い）", () => {
    const used = new Set(GLOSSARY_TERMS.map((term) => term.category));
    expect(new Set(GLOSSARY_CATEGORIES)).toEqual(used);
  });
});

describe("isMentsuExample", () => {
  it("面子の例を面子の例と判定する", () => {
    expect(isMentsuExample({ mentsu: exampleMinkou(HaiKind.PinZu8) })).toBe(
      true,
    );
  });

  it("牌の並びの例は面子の例と判定しない", () => {
    expect(isMentsuExample({ tiles: [HaiKind.ManZu1] })).toBe(false);
  });
});

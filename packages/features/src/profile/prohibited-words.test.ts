import { describe, expect, it } from "vitest";

import {
  containsProhibitedWord,
  normalizeForMatching,
} from "./prohibited-words";

describe("normalizeForMatching", () => {
  it("全角・大文字・カタカナ・区切りを畳む", () => {
    expect(normalizeForMatching("Ｆ.U c-K")).toBe("fuck");
    expect(normalizeForMatching("ｾｯｸｽ")).toBe("せっくす");
    expect(normalizeForMatching("ニガー")).toBe("にがー");
  });
});

describe("containsProhibitedWord", () => {
  it.each(["死ね", "お前 死 ね", "F*U*C*K you", "ﾁﾝｺ", "基地外です"])(
    "%s を弾く",
    (text) => {
      expect(containsProhibitedWord(text)).toBe(true);
    },
  );

  it.each([
    "",
    "麻雀が好きです。清一色（ちんいつ）とチョンボに気をつけています",
    "萬子（まんず）の染め手が得意",
    "おいしいね",
    "外人さんと打ちました",
    "grape and scrape",
    "Essex 出身",
    "沈降",
  ])("%s は通す", (text) => {
    expect(containsProhibitedWord(text)).toBe(false);
  });
});

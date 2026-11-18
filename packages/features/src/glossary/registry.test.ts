import { describe, expect, it } from "vitest";

import {
  GLOSSARY_TERM_SLUGS,
  getGlossaryTermBySlug,
  isGlossaryTermSlug,
} from "./registry";

describe("isGlossaryTermSlug", () => {
  it("登録済みのどの用語の slug も用語として認める", () => {
    for (const slug of GLOSSARY_TERM_SLUGS) {
      expect(isGlossaryTermSlug(slug), slug).toBe(true);
    }
  });

  it("登録に無い文字列は認めない（辞書の綴り違いのリンクを素のテキストに戻す）", () => {
    expect(isGlossaryTermSlug("no-such-term")).toBe(false);
  });

  it("文字列でない値は認めない", () => {
    expect(isGlossaryTermSlug(undefined)).toBe(false);
    expect(isGlossaryTermSlug(42)).toBe(false);
  });
});

describe("getGlossaryTermBySlug", () => {
  it("slug から同じ slug の用語を引く", () => {
    for (const slug of GLOSSARY_TERM_SLUGS) {
      expect(getGlossaryTermBySlug(slug)?.slug).toBe(slug);
    }
  });

  it("未知の slug は undefined", () => {
    expect(getGlossaryTermBySlug("no-such-term")).toBeUndefined();
  });
});

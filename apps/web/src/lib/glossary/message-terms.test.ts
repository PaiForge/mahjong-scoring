import { describe, expect, it } from "vitest";

import { collectTermSlugsInNamespace } from "./message-terms";

describe("collectTermSlugsInNamespace", () => {
  it("存在しない名前空間では空配列を返す", () => {
    expect(collectTermSlugsInNamespace("noSuchChapter.learn")).toEqual([]);
  });

  it("マークアップを持たない名前空間では空配列を返す", () => {
    expect(collectTermSlugsInNamespace("glossary.categories")).toEqual([]);
  });

  it("配列を含む名前空間を走査しても落ちない", () => {
    expect(collectTermSlugsInNamespace("common")).toBeInstanceOf(Array);
  });
});

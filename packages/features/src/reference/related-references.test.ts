import { describe, expect, it } from "vitest";

import { relatedReferences } from "./related-references";

describe("relatedReferences", () => {
  it("自分を除いた早見表を一覧の順に返す", () => {
    expect(relatedReferences("yaku", "/score-table")).toEqual([
      { key: "scoreTable", href: "/score-table" },
      { key: "glossary", href: "/reference/glossary" },
    ]);
    expect(
      relatedReferences("scoreTable", "/reference/score-table").map(
        ({ key }) => key,
      ),
    ).toEqual(["yaku", "glossary"]);
    expect(
      relatedReferences("glossary", "/reference/score-table").map(
        ({ href }) => href,
      ),
    ).toEqual(["/reference/score-table", "/reference/yaku"]);
  });
});

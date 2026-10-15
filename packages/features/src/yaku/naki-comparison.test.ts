import { describe, expect, it } from "vitest";
import { isKuisagariEntry } from "@mahjong-scoring/core";
import type { YakuHanEntry } from "@mahjong-scoring/core";

import { NakiKind, buildNakiComparisonGroups } from "./naki-comparison";

/** 役のデータから読める区分 */
function classifyEntry(entry: YakuHanEntry): NakiKind {
  if (entry.nakiHan === undefined) return NakiKind.MenzenOnly;
  return isKuisagariEntry(entry) ? NakiKind.Kuisagari : NakiKind.Unchanged;
}

describe("buildNakiComparisonGroups", () => {
  const groups = buildNakiComparisonGroups();

  it("本文が説明する順に 3 区分を並べる", () => {
    expect(groups.map((group) => group.kind)).toEqual([
      NakiKind.MenzenOnly,
      NakiKind.Kuisagari,
      NakiKind.Unchanged,
    ]);
  });

  it("挙げた役名はすべて役のデータにある（打ち間違いで行が消えない）", () => {
    expect(groups.flatMap((group) => group.entries).length).toBe(10);
  });

  it("各役は役のデータどおりの区分に置かれる", () => {
    for (const group of groups) {
      for (const entry of group.entries) {
        expect(classifyEntry(entry), entry.name).toBe(group.kind);
      }
    }
  });
});

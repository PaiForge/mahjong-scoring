import { describe, it, expect } from "vitest";
import { YAKU_HAN_ENTRIES } from "@mahjong-scoring/core";
import { yakuAnchorId, referenceYakuHref } from "./anchors";
import { hasYakuCheatsheetEntry } from "./yaku-examples";

/** 早見表に載る役（＝教本からリンクを張る役） */
const LINKABLE_NAMES = YAKU_HAN_ENTRIES.map((e) => e.name).filter(
  hasYakuCheatsheetEntry,
);

describe("yakuAnchorId / referenceYakuHref", () => {
  it("href のハッシュをデコードすると id と一致する", () => {
    for (const name of LINKABLE_NAMES) {
      const hash = new URL(referenceYakuHref(name), "https://example.test")
        .hash;
      expect(decodeURIComponent(hash.slice(1)), `${name} のアンカー`).toBe(
        yakuAnchorId(name),
      );
    }
  });

  it("役ごとに一意な id を返す", () => {
    const ids = LINKABLE_NAMES.map(yakuAnchorId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("hasYakuCheatsheetEntry", () => {
  it("状況役（早見表の除外役）は載らない", () => {
    expect(hasYakuCheatsheetEntry("立直")).toBe(false);
    expect(hasYakuCheatsheetEntry("門前清自摸和")).toBe(false);
  });

  it("手牌の形を持つ役は載る", () => {
    expect(hasYakuCheatsheetEntry("混一色")).toBe(true);
    expect(hasYakuCheatsheetEntry("国士無双")).toBe(true);
  });

  it("役として存在しない名前は載らない", () => {
    expect(hasYakuCheatsheetEntry("存在しない役")).toBe(false);
  });
});

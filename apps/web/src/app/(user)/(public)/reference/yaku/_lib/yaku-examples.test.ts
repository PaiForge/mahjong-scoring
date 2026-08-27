import { describe, it, expect } from "vitest";
import {
  YAKU_HAN_ENTRIES,
  YAKU_OPTIONS,
  parseTehai,
} from "@mahjong-scoring/core";
import {
  YAKU_EXAMPLES,
  YAKU_CHEATSHEET_EXCLUDED,
  resolveYakuCheatsheetName,
} from "./yaku-examples";

/** 副露を含む手牌の有効牌数（槓子は4枚だが面子として3枚分で数える） */
function effectiveTileCount(
  tehai: NonNullable<ReturnType<typeof parseTehai>>,
): number {
  const exposedCount = tehai.exposed.reduce(
    (sum, m) => sum + (m.hais.length === 4 ? 3 : m.hais.length),
    0,
  );
  return tehai.closed.length + exposedCount;
}

describe("YAKU_EXAMPLES", () => {
  it("除外役を除く全ての YAKU_HAN_ENTRIES に例示手牌が定義されている", () => {
    for (const entry of YAKU_HAN_ENTRIES) {
      if (YAKU_CHEATSHEET_EXCLUDED.has(entry.name)) continue;
      const examples = YAKU_EXAMPLES[entry.name];
      expect(examples, `例示手牌が未定義: ${entry.name}`).toBeDefined();
      expect(examples?.length ?? 0, `例が空: ${entry.name}`).toBeGreaterThan(0);
    }
  });

  it("YAKU_HAN_ENTRIES に存在しない役・除外役が定義されていない", () => {
    const validNames = new Set(YAKU_HAN_ENTRIES.map((e) => e.name));
    for (const name of Object.keys(YAKU_EXAMPLES)) {
      expect(validNames.has(name), `未知の役: ${name}`).toBe(true);
      expect(
        YAKU_CHEATSHEET_EXCLUDED.has(name),
        `除外役が定義されている: ${name}`,
      ).toBe(false);
    }
  });

  it("全ての例示手牌がパース可能で、有効牌数が14枚である", () => {
    for (const [name, examples] of Object.entries(YAKU_EXAMPLES)) {
      for (const ex of examples) {
        const tehai = parseTehai(ex.mspz);
        expect(tehai, `パース失敗: ${name} / ${ex.mspz}`).toBeDefined();
        if (!tehai) continue;
        expect(
          effectiveTileCount(tehai),
          `${name} / ${ex.mspz}: 有効牌数は14`,
        ).toBe(14);
      }
    }
  });
});

describe("resolveYakuCheatsheetName", () => {
  it("早見表にそのまま載っている役はその役名を返す", () => {
    expect(resolveYakuCheatsheetName("混一色")).toBe("混一色");
  });

  it("牌まで含んだ役牌は「役牌」のカードに寄せる", () => {
    expect(resolveYakuCheatsheetName("役牌 白")).toBe("役牌");
    expect(resolveYakuCheatsheetName("役牌 東")).toBe("役牌");
  });

  it("早見表に載らない状況役は undefined を返す", () => {
    expect(resolveYakuCheatsheetName("立直")).toBeUndefined();
    expect(resolveYakuCheatsheetName("門前清自摸和")).toBeUndefined();
  });

  it("点数訓練で選べる役は、状況役を除いてすべて解決できる", () => {
    const unresolved = YAKU_OPTIONS.filter(
      (name) => resolveYakuCheatsheetName(name) === undefined,
    );

    expect([...unresolved].sort()).toEqual(
      [...YAKU_CHEATSHEET_EXCLUDED].sort(),
    );
  });
});

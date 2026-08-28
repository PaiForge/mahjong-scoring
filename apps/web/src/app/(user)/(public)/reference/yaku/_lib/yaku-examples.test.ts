import { describe, it, expect } from "vitest";
import {
  YAKU_HAN_ENTRIES,
  YAKU_OPTIONS,
  parseHais,
  parseTehai,
} from "@mahjong-scoring/core";
import type { YakuExampleHand, YakuExampleSet } from "./yaku-examples";
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

/** 例示手牌に入っている手牌を、形と牌の見出し付きで列挙する */
function eachHand(examples: readonly YakuExampleSet[]): readonly {
  readonly form: "menzen" | "naki";
  readonly label: string;
  readonly hand: YakuExampleHand;
}[] {
  return examples.flatMap((example) => {
    const prefix = example.variant === undefined ? "" : `${example.variant}/`;
    const menzen = {
      form: "menzen",
      label: `${prefix}門前`,
      hand: example.menzen,
    } as const;
    return example.naki === undefined
      ? [menzen]
      : [
          menzen,
          { form: "naki", label: `${prefix}鳴き`, hand: example.naki } as const,
        ];
  });
}

describe("YAKU_EXAMPLES", () => {
  it("除外役を除く全ての YAKU_HAN_ENTRIES に例示手牌が定義されている", () => {
    for (const entry of YAKU_HAN_ENTRIES) {
      if (YAKU_CHEATSHEET_EXCLUDED.has(entry.name)) continue;
      expect(
        YAKU_EXAMPLES[entry.name],
        `例示手牌が未定義: ${entry.name}`,
      ).toBeDefined();
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

  it("鳴いて成立する役だけが副露形を持つ", () => {
    for (const entry of YAKU_HAN_ENTRIES) {
      const examples = YAKU_EXAMPLES[entry.name];
      if (examples === undefined) continue;
      for (const example of examples) {
        expect(
          example.naki !== undefined,
          entry.nakiHan === undefined
            ? `門前限定役に副露形がある: ${entry.name}`
            : `鳴いて成立する役に副露形がない: ${entry.name}`,
        ).toBe(entry.nakiHan !== undefined);
      }
    }
  });

  it("例を複数持つ役は、牌の見出しを全ての例に重複なく付けている", () => {
    for (const [name, examples] of Object.entries(YAKU_EXAMPLES)) {
      expect(examples.length, `例が空: ${name}`).toBeGreaterThan(0);
      if (examples.length === 1) continue;

      const variants = examples.map((example) => example.variant);
      expect(
        variants.every((variant) => variant !== undefined),
        `例が複数あるのに牌の見出しがない: ${name}`,
      ).toBe(true);
      expect(new Set(variants).size, `牌の見出しが重複: ${name}`).toBe(
        variants.length,
      );
    }
  });

  it("全ての例示手牌がパース可能で、有効牌数が14枚である", () => {
    for (const [name, examples] of Object.entries(YAKU_EXAMPLES)) {
      for (const { label, hand } of eachHand(examples)) {
        const tehai = parseTehai(hand.mspz);
        expect(
          tehai,
          `パース失敗: ${name} / ${label} / ${hand.mspz}`,
        ).toBeDefined();
        if (!tehai) continue;
        expect(
          effectiveTileCount(tehai),
          `${name} / ${label} / ${hand.mspz}: 有効牌数は14`,
        ).toBe(14);
      }
    }
  });

  it("門前形は副露を持たず、副露形は副露を持つ（暗槓は副露に数えない）", () => {
    for (const [name, examples] of Object.entries(YAKU_EXAMPLES)) {
      for (const { form, label, hand } of eachHand(examples)) {
        const tehai = parseTehai(hand.mspz);
        if (!tehai) continue;
        const furoCount = tehai.exposed.filter(
          (m) => m.furo !== undefined,
        ).length;
        if (form === "menzen") {
          expect(furoCount, `${name} ${label} に副露がある: ${hand.mspz}`).toBe(
            0,
          );
        } else {
          expect(
            furoCount,
            `${name} ${label} に副露がない: ${hand.mspz}`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("和了牌は、その手牌の純手牌に含まれる1枚である", () => {
    for (const [name, examples] of Object.entries(YAKU_EXAMPLES)) {
      for (const { label, hand } of eachHand(examples)) {
        if (hand.agari === undefined) continue;

        const agariHais = parseHais(hand.agari.hai);
        expect(
          agariHais.length,
          `${name} ${label} の和了牌は1枚: ${hand.agari.hai}`,
        ).toBe(1);

        const closed = parseTehai(hand.mspz)?.closed ?? [];
        expect(
          closed.includes(agariHais[0]),
          `${name} ${label} の和了牌 ${hand.agari.hai} が純手牌 ${hand.mspz} に無い`,
        ).toBe(true);
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

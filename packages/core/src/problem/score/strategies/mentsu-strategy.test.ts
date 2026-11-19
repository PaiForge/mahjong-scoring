import { describe, expect, it } from "vitest";
import { MentsuType } from "@pai-forge/riichi-mahjong";

import { seededRandom } from "../../../test/seeded-random";
import { generateMentsuTehai, type MentsuTehaiResult } from "./mentsu-strategy";

/**
 * シード 0〜299 で面子手を作る（乱数を固定した決定的な標本）。
 * 和了牌の候補の分岐（副露・槓子を外す）は面子の組み合わせ次第なので、
 * 1 シードではなく固定の標本全体で性質を確かめる。
 */
function generatedHands(includeFuro: boolean): MentsuTehaiResult[] {
  const hands: MentsuTehaiResult[] = [];
  for (let seed = 0; seed < 300; seed++) {
    const result = generateMentsuTehai(includeFuro, seededRandom(seed));
    if (result) hands.push(result);
  }
  return hands;
}

describe("generateMentsuTehai", () => {
  const withFuro = generatedHands(true);

  it("和了牌は必ず純手牌の中にある（副露・槓子の牌で和了しない）", () => {
    expect(withFuro.length).toBeGreaterThan(0);
    for (const { tehai, agariHai } of withFuro) {
      expect(tehai.closed).toContain(agariHai);
    }
  });

  it("和了の対象は門前の順子・刻子か雀頭で、その牌を含む", () => {
    for (const { structure, agariHai } of withFuro) {
      const { agariTarget, mentsuList, pair } = structure;
      if (agariTarget.type === "pair") {
        expect(agariHai).toBe(pair);
        continue;
      }
      const target = mentsuList[agariTarget.index];
      expect(target?.isFuro).toBe(false);
      expect(target?.type).not.toBe(MentsuType.Kantsu);
      expect(target?.hais).toContain(agariHai);
    }
  });

  it("面子で和了する手も雀頭で和了する手も作る", () => {
    const targets = new Set(
      withFuro.map(({ structure }) => structure.agariTarget.type),
    );
    expect([...targets].sort()).toEqual(["mentsu", "pair"]);
  });

  it("構造の副露の印は手牌の副露と一致する", () => {
    expect(
      withFuro.some(({ tehai }) => tehai.exposed.some((m) => m.furo)),
    ).toBe(true);
    for (const { tehai, structure } of withFuro) {
      expect(structure.mentsuList.filter((m) => m.isFuro)).toHaveLength(
        tehai.exposed.filter((m) => m.furo).length,
      );
    }
  });

  it("副露を許さなければ副露の無い手だけを作る", () => {
    for (const { tehai, structure } of generatedHands(false)) {
      expect(tehai.exposed.every((m) => !m.furo)).toBe(true);
      expect(structure.mentsuList.every((m) => !m.isFuro)).toBe(true);
    }
  });
});

import { describe, expect, it } from "vitest";

import { choiceKey, isSameChoice, type LessonChoice } from "./quiz";

/** 種類ごとに 1 つずつの選択肢 */
const ONE_OF_EACH_KIND: readonly LessonChoice[] = [
  { kind: "points", points: 8000 },
  { kind: "koTsumo", fromKo: 2000, fromOya: 4000 },
  { kind: "oyaTsumo", all: 4000 },
  { kind: "han", han: 3 },
  { kind: "yakuman" },
  { kind: "fu", fu: 30 },
];

describe("choiceKey", () => {
  it("種類が違えば、数が同じでも相異なる空でないキーになる", () => {
    const keys = ONE_OF_EACH_KIND.map(choiceKey);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(key).not.toBe("");
    }
  });

  it("同じ値の選択肢は、別に作った値でも同じキーになる", () => {
    expect(choiceKey({ kind: "yakuman" })).toBe(choiceKey({ kind: "yakuman" }));
    expect(choiceKey({ kind: "koTsumo", fromKo: 2000, fromOya: 4000 })).toBe(
      choiceKey({ kind: "koTsumo", fromKo: 2000, fromOya: 4000 }),
    );
  });
});

describe("isSameChoice", () => {
  it("同じ値の選択肢は同じとみなす", () => {
    expect(isSameChoice({ kind: "fu", fu: 30 }, { kind: "fu", fu: 30 })).toBe(
      true,
    );
  });

  it("種類か値が違えば同じとみなさない", () => {
    expect(isSameChoice({ kind: "fu", fu: 30 }, { kind: "fu", fu: 40 })).toBe(
      false,
    );
    expect(isSameChoice({ kind: "fu", fu: 3 }, { kind: "han", han: 3 })).toBe(
      false,
    );
    expect(
      isSameChoice(
        { kind: "koTsumo", fromKo: 2000, fromOya: 4000 },
        { kind: "koTsumo", fromKo: 4000, fromOya: 2000 },
      ),
    ).toBe(false);
  });
});

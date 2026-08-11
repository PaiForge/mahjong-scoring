import { describe, it, expect } from "vitest";

import { YAKU_HAN_ENTRIES, YAKUMAN_HAN } from "./constants";
import { YAKU_OPTIONS } from "../../core/yaku-names";

/**
 * `YAKU_OPTIONS` にあって `YAKU_HAN_ENTRIES` に無くてよい役名。
 *
 * 役翻数練習は風牌・三元牌の役牌を「役牌」1件にまとめて出題する
 * （どの役牌でも1翻で、牌の種類は翻数に影響しないため）。
 * 一方 `YAKU_OPTIONS` は役当て練習の選択肢で、牌ごとに区別する必要がある。
 */
const YAKUHAI_VARIANTS: ReadonlySet<string> = new Set([
  "役牌 東",
  "役牌 南",
  "役牌 西",
  "役牌 北",
  "役牌 白",
  "役牌 發",
  "役牌 中",
]);

describe("YAKU_HAN_ENTRIES", () => {
  it("役牌のまとめ方を除き YAKU_OPTIONS の全ての役を網羅している", () => {
    const covered = new Set(YAKU_HAN_ENTRIES.map((e) => e.name));
    const missing = YAKU_OPTIONS.filter(
      (name) => !covered.has(name) && !YAKUHAI_VARIANTS.has(name),
    );

    expect(
      missing,
      `出題プールから漏れている役: ${missing.join(", ")}`,
    ).toEqual([]);
  });

  it("YAKU_OPTIONS に存在しない役を含まない（役牌のまとめを除く）", () => {
    const options = new Set<string>(YAKU_OPTIONS);
    const unknown = YAKU_HAN_ENTRIES.map((e) => e.name).filter(
      (name) => !options.has(name) && name !== "役牌",
    );

    expect(unknown, `未知の役: ${unknown.join(", ")}`).toEqual([]);
  });

  it("役名が重複していない", () => {
    const names = YAKU_HAN_ENTRIES.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("四喜和は大小そろって役満として登録されている", () => {
    for (const name of ["小四喜", "大四喜"]) {
      const entry = YAKU_HAN_ENTRIES.find((e) => e.name === name);
      expect(entry, `${name} が未登録`).toBeDefined();
      expect(entry?.menzenHan).toBe(YAKUMAN_HAN);
      // 四喜和はいずれも鳴いて成立する
      expect(entry?.nakiHan).toBe(YAKUMAN_HAN);
    }
  });
});

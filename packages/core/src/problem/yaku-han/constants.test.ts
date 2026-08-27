import { describe, it, expect } from "vitest";

import {
  YAKU_HAN_ENTRIES,
  YAKUMAN_HAN,
  YAKUHAI_ENTRY_NAME,
  findYakuHanEntry,
  groupYakuHanEntriesByMenzenHan,
} from "./constants";
import { YAKU_OPTION_GROUPS, YAKU_OPTIONS } from "../../core/yaku-names";

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

  it("YAKU_OPTION_GROUPS の翻数が menzenHan と一致する", () => {
    const hanOf = new Map(YAKU_HAN_ENTRIES.map((e) => [e.name, e.menzenHan]));

    for (const group of YAKU_OPTION_GROUPS) {
      for (const name of group.names) {
        const entryName = YAKUHAI_VARIANTS.has(name) ? "役牌" : name;
        expect(
          hanOf.get(entryName),
          `${name} のグループは ${group.han} 翻だが YAKU_HAN_ENTRIES と異なる`,
        ).toBe(group.han);
      }
    }
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

describe("groupYakuHanEntriesByMenzenHan", () => {
  it("全ての役をいずれかのグループに漏れなく振り分ける", () => {
    const groups = groupYakuHanEntriesByMenzenHan(YAKU_HAN_ENTRIES);
    const grouped = groups.flatMap((g) => g.entries);

    expect(grouped).toHaveLength(YAKU_HAN_ENTRIES.length);
    expect(new Set(grouped.map((e) => e.name)).size).toBe(
      YAKU_HAN_ENTRIES.length,
    );
  });

  it("グループ内の役は全て同じ門前翻数を持つ", () => {
    for (const group of groupYakuHanEntriesByMenzenHan(YAKU_HAN_ENTRIES)) {
      for (const entry of group.entries) {
        expect(entry.menzenHan, `${entry.name} のグループが不正`).toBe(
          group.han,
        );
      }
    }
  });

  it("グループは翻数の低い順（役満が最後）に並ぶ", () => {
    const hans = groupYakuHanEntriesByMenzenHan(YAKU_HAN_ENTRIES).map(
      (g) => g.han,
    );

    expect(hans).toEqual([...hans].sort((a, b) => a - b));
    expect(hans.at(-1)).toBe(YAKUMAN_HAN);
  });

  it("役を絞り込んでも残った役だけでグループを作る", () => {
    const groups = groupYakuHanEntriesByMenzenHan(
      YAKU_HAN_ENTRIES.filter((e) => e.menzenHan === YAKUMAN_HAN),
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.han).toBe(YAKUMAN_HAN);
  });
});

describe("findYakuHanEntry", () => {
  it("役名がそのまま登録されている役はそのエントリを返す", () => {
    expect(findYakuHanEntry("混一色")?.name).toBe("混一色");
    expect(findYakuHanEntry("国士無双")?.name).toBe("国士無双");
  });

  it("書き分けた役牌は「役牌」のエントリに解決する", () => {
    for (const name of YAKUHAI_VARIANTS) {
      expect(findYakuHanEntry(name)?.name, `${name} の解決先`).toBe(
        YAKUHAI_ENTRY_NAME,
      );
    }
  });

  it("選択肢の全ての役がエントリに解決する", () => {
    const unresolved = YAKU_OPTIONS.filter(
      (name) => findYakuHanEntry(name) === undefined,
    );

    expect(
      unresolved,
      `エントリに解決できない役: ${unresolved.join(", ")}`,
    ).toEqual([]);
  });

  it("登録されていない役名は undefined を返す", () => {
    expect(findYakuHanEntry("存在しない役")).toBeUndefined();
  });
});

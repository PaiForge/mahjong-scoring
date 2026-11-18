import { describe, expect, it } from "vitest";
import { messages } from "@mahjong-scoring/messages/ja";

import { buildTenpaneRows } from "./tenpane-rows";

/** 表の 4 枚（門前 / 副露 × ツモ / ロン） */
const TABLES = [
  ["menzen", "ron"],
  ["menzen", "tsumo"],
  ["furo", "ron"],
  ["furo", "tsumo"],
] as const;

describe("buildTenpaneRows", () => {
  it("門前のロンは30符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("menzen", "ron").map(({ totalFu, fu }) => [totalFu, fu]),
    ).toEqual([
      [32, 40],
      [40, 40],
      [42, 50],
      [62, 70],
    ]);
  });

  it("門前のツモは22符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("menzen", "tsumo").map(({ totalFu, fu }) => [
        totalFu,
        fu,
      ]),
    ).toEqual([
      [24, 30],
      [30, 30],
      [32, 40],
      [38, 40],
    ]);
  });

  it("鳴いた手のロンは門前加符が付かず20符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("furo", "ron").map(({ totalFu, fu }) => [totalFu, fu]),
    ).toEqual([
      [22, 30],
      [30, 30],
      [32, 40],
      [36, 40],
    ]);
  });

  it("鳴いた手のツモは門前と同じ22符から足して切り上げる", () => {
    expect(
      buildTenpaneRows("furo", "tsumo").map(({ totalFu, fu }) => [totalFu, fu]),
    ).toEqual([
      [24, 30],
      [30, 30],
      [32, 40],
      [38, 40],
    ]);
  });
});

describe("buildTenpaneRows の例と辞書", () => {
  it.each(TABLES)(
    "%s の %s の表の例は辞書に説明があり、説明の符が積み上げた符と一致する",
    (handShape, winType) => {
      for (const { key, extraFu } of buildTenpaneRows(handShape, winType)) {
        const label: unknown = Reflect.get(
          messages.learnCurriculum.tenpaneExamples,
          key,
        );
        expect(label, key).toEqual(expect.stringContaining(`（${extraFu}符）`));
      }
    },
  );

  it.each(TABLES)("%s の %s の表の例は重複しない", (handShape, winType) => {
    const keys = buildTenpaneRows(handShape, winType).map(({ key }) => key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

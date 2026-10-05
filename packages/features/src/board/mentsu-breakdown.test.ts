import { MentsuType } from "@mahjong-scoring/core";
import type { MentsuBreakdownRow } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { hasRonMinkou, mentsuBreakdownLabelKey } from "./mentsu-breakdown";

/** 判定に効く項目だけを持つ行 */
const row = (
  type: MentsuType,
  isOpen: boolean,
  isExposed: boolean,
): MentsuBreakdownRow =>
  ({
    mentsu: { type, hais: [] },
    isOpen,
    isExposed,
  }) as unknown as MentsuBreakdownRow;

describe("mentsuBreakdownLabelKey", () => {
  it("刻子・槓子は明暗で呼び分ける", () => {
    expect(mentsuBreakdownLabelKey(row(MentsuType.Shuntsu, false, false))).toBe(
      "shuntsu",
    );
    expect(mentsuBreakdownLabelKey(row(MentsuType.Koutsu, true, false))).toBe(
      "minkou",
    );
    expect(mentsuBreakdownLabelKey(row(MentsuType.Koutsu, false, false))).toBe(
      "ankou",
    );
    expect(mentsuBreakdownLabelKey(row(MentsuType.Kantsu, true, true))).toBe(
      "minkan",
    );
    expect(mentsuBreakdownLabelKey(row(MentsuType.Kantsu, false, true))).toBe(
      "ankan",
    );
  });
});

describe("hasRonMinkou", () => {
  it("晒していない明刻（ロンで完成した刻子）だけを拾う", () => {
    expect(hasRonMinkou([row(MentsuType.Koutsu, true, false)])).toBe(true);
    expect(hasRonMinkou([row(MentsuType.Koutsu, true, true)])).toBe(false);
    expect(hasRonMinkou([row(MentsuType.Koutsu, false, false)])).toBe(false);
  });
});

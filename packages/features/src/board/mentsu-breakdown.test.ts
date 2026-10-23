import { HaiKind, MentsuType } from "@mahjong-scoring/core";
import type { MentsuBreakdownRow } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { DEMO_CHIITOITSU_HAND, DEMO_MENTSU_HAND } from "./demo-score-question";
import {
  hasMentsuBreakdown,
  mentsuBreakdownLabelKey,
} from "./mentsu-breakdown";

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

describe("hasMentsuBreakdown", () => {
  const context = { bakaze: HaiKind.Ton, jikaze: HaiKind.Nan } as const;

  it("面子手は分解を持つ", () => {
    const { closed, agariHai, isTsumo } = DEMO_MENTSU_HAND;
    expect(
      hasMentsuBreakdown(
        { closed, exposed: [] },
        { ...context, agariHai, isTsumo },
      ),
    ).toBe(true);
  });

  it("七対子は分解を持たない", () => {
    const { closed, agariHai, isTsumo } = DEMO_CHIITOITSU_HAND;
    expect(
      hasMentsuBreakdown(
        { closed, exposed: [] },
        { ...context, agariHai, isTsumo },
      ),
    ).toBe(false);
  });
});

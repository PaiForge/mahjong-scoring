import { describe, expect, it } from "vitest";
import { HaiKind, MentsuType, type HaiKindId } from "@pai-forge/riichi-mahjong";

import { HaiUsageTracker } from "../../../core/hai-tracker";
import { isHaiKindId } from "../../../core/type-guards";
import { seededRandom } from "../../../test/seeded-random";
import {
  generateKantsu,
  generateKoutsu,
  generateShuntsu,
  generateWeightedMentsu,
} from "./shape-generator";

/** 指定した牌種だけを 4 枚残し、他の牌種をすべて使い切った tracker */
function trackerLeaving(available: readonly HaiKindId[]): HaiUsageTracker {
  const tracker = new HaiUsageTracker();
  for (let id = 0; id <= 33; id++) {
    if (!isHaiKindId(id) || available.includes(id)) continue;
    tracker.use(id, 4)._unsafeUnwrap();
  }
  return tracker;
}

describe("generateShuntsu", () => {
  it("使える牌がそろう順子だけを選ぶ（一部の牌が残っているだけの順子は選ばない）", () => {
    // 1m〜3m の 3 種だけが残る。2m・3m を含む 234m などは 4m が無いので作れない
    for (let seed = 0; seed < 20; seed++) {
      const tracker = trackerLeaving([
        HaiKind.ManZu1,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
      ]);
      expect(generateShuntsu(tracker, false, seededRandom(seed))?.hais).toEqual(
        [HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3],
      );
    }
  });

  it("鳴きを省略すると門前の順子を作る", () => {
    const shuntsu = generateShuntsu(new HaiUsageTracker());
    expect(shuntsu?.type).toBe(MentsuType.Shuntsu);
    expect(shuntsu?.furo).toBeUndefined();
  });
});

describe("鳴きを省略したときの刻子・槓子", () => {
  it("刻子は門前の刻子を作る", () => {
    const koutsu = generateKoutsu(new HaiUsageTracker());
    expect(koutsu?.type).toBe(MentsuType.Koutsu);
    expect(koutsu?.furo).toBeUndefined();
  });

  it("槓子は暗槓を作る", () => {
    const kantsu = generateKantsu(new HaiUsageTracker());
    expect(kantsu?.type).toBe(MentsuType.Kantsu);
    expect(kantsu?.furo).toBeUndefined();
  });

  it("重み付きの面子も門前で作る", () => {
    for (let seed = 0; seed < 20; seed++) {
      const mentsu = generateWeightedMentsu(
        new HaiUsageTracker(),
        { shuntsu: 0.4, koutsu: 0.3 },
        undefined,
        seededRandom(seed),
      );
      expect(mentsu?.furo).toBeUndefined();
    }
  });
});

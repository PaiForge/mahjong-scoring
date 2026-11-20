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

describe("generateWeightedMentsu", () => {
  /** 重みで種別を 1 つに決め打ちして、牌が十分に残る状態から面子を作る */
  function typesOf(weights: { shuntsu: number; koutsu: number }) {
    return new Set(
      Array.from(
        { length: 20 },
        (_, seed) =>
          generateWeightedMentsu(
            new HaiUsageTracker(),
            weights,
            false,
            seededRandom(seed),
          )?.type,
      ),
    );
  }

  it("牌が足りていれば、抽選で決まった種別の面子をそのまま作る", () => {
    expect(typesOf({ shuntsu: 1, koutsu: 0 })).toEqual(
      new Set([MentsuType.Shuntsu]),
    );
    expect(typesOf({ shuntsu: 0, koutsu: 1 })).toEqual(
      new Set([MentsuType.Koutsu]),
    );
    expect(typesOf({ shuntsu: 0, koutsu: 0 })).toEqual(
      new Set([MentsuType.Kantsu]),
    );
  });

  it("槓子を作れる牌が残っていなければ、刻子に切り替える", () => {
    // 1m だけ 3 枚残す。槓子（4 枚）も順子も作れず、刻子だけが作れる
    const tracker = trackerLeaving([HaiKind.ManZu1]);
    tracker.use(HaiKind.ManZu1, 1)._unsafeUnwrap();

    const mentsu = generateWeightedMentsu(
      tracker,
      { shuntsu: 0, koutsu: 0 },
      false,
      seededRandom(1),
    );
    expect(mentsu?.type).toBe(MentsuType.Koutsu);
    expect(mentsu?.hais).toEqual([
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu1,
    ]);
  });
});

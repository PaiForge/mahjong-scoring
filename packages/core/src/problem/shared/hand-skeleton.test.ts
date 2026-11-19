import { describe, expect, it } from "vitest";
import {
  FuroType,
  HaiKind,
  MentsuType,
  Tacha,
  type HaiKindId,
  type Koutsu,
  type Shuntsu,
} from "@pai-forge/riichi-mahjong";

import { HaiUsageTracker } from "../../core/hai-tracker";
import { validateHaiKindId } from "../../core/type-guards";
import {
  generateMentsuSet,
  generatePairTile,
  reserveMentsuHais,
  pickRonAgariHai,
} from "./hand-skeleton";
import type { MentsuResult } from "../mentsu-fu/mentsu-factory";

/** 34種すべてを4枚ずつ使い切ったトラッカー */
function makeExhaustedTracker(): HaiUsageTracker {
  const tracker = new HaiUsageTracker();
  for (let i = 0; i <= 33; i++) {
    tracker.use(i as HaiKindId, 4);
  }
  return tracker;
}

const WEIGHTS = { shuntsu: 0.5, koutsu: 0.3 } as const;

/** 渡した値を順に返し、尽きたら先頭に戻る乱数源（引きの分岐を値で選ぶ） */
function sequenceRandom(values: readonly number[]): () => number {
  let index = 0;
  return () => values[index++ % values.length];
}

/** 牌種 ID を足して面子の牌を作る（数牌の連番。範囲外はテストの誤り） */
function haiAt(base: HaiKindId, offset: number): HaiKindId {
  const result = validateHaiKindId(base + offset);
  if (result.isErr()) throw new Error(`牌種 ${base + offset} が不正`);
  return result.value;
}

/** 暗刻 */
function koutsu(tile: HaiKindId): Koutsu {
  return { type: MentsuType.Koutsu, hais: [tile, tile, tile] };
}

/** start から始まる暗順子 */
function shuntsu(start: HaiKindId): Shuntsu {
  return {
    type: MentsuType.Shuntsu,
    hais: [start, haiAt(start, 1), haiAt(start, 2)],
  };
}

describe("generatePairTile", () => {
  it("使用可能な牌があれば2枚を使用登録して返す", () => {
    const tracker = new HaiUsageTracker();
    const tile = generatePairTile(tracker);

    expect(tile).toBeDefined();
    if (tile === undefined) return;
    // 2枚使用済み → あと2枚は使えるが3枚は使えない
    expect(tracker.canUse(tile, 2)).toBe(true);
    expect(tracker.canUse(tile, 3)).toBe(false);
  });

  it("残り牌が無ければ undefined を返す", () => {
    expect(generatePairTile(makeExhaustedTracker())).toBeUndefined();
  });

  it("失敗時にトラッカーの使用枚数を変えない", () => {
    const tracker = new HaiUsageTracker();
    // 全牌を3枚ずつ使用 → 雀頭（2枚）はどこにも確保できない
    for (let i = 0; i <= 33; i++) {
      tracker.use(i as HaiKindId, 3);
    }

    expect(generatePairTile(tracker)).toBeUndefined();
    // 4枚目が使われていない（1枚ずつはまだ残っている）
    for (let i = 0; i <= 33; i++) {
      expect(tracker.canUse(i as HaiKindId, 1)).toBe(true);
    }
  });
});

describe("generateMentsuSet", () => {
  it("指定数の面子を生成する", () => {
    const results = generateMentsuSet(new HaiUsageTracker(), WEIGHTS, 4);

    expect(results).toBeDefined();
    expect(results?.length).toBe(4);
  });

  it("生成した面子の牌がトラッカーに使用登録される", () => {
    const tracker = new HaiUsageTracker();
    const results = generateMentsuSet(tracker, WEIGHTS, 1);

    expect(results).toBeDefined();
    if (!results) return;

    // 生成した面子と同じ牌を、上限を超えて確保することはできない
    const [{ mentsu }] = results;
    const used = new Map<HaiKindId, number>();
    for (const t of mentsu.hais) used.set(t, (used.get(t) ?? 0) + 1);

    for (const [tile, count] of used) {
      expect(tracker.canUse(tile, 4 - count)).toBe(true);
      expect(tracker.canUse(tile, 5 - count)).toBe(false);
    }
  });

  it("同じ牌が5枚以上使われる面子セットを生成しない", () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const results = generateMentsuSet(new HaiUsageTracker(), WEIGHTS, 4);
      if (!results) continue;

      const counts = new Map<HaiKindId, number>();
      for (const { mentsu } of results) {
        for (const t of mentsu.hais) counts.set(t, (counts.get(t) ?? 0) + 1);
      }
      for (const count of counts.values()) {
        expect(count).toBeLessThanOrEqual(4);
      }
    }
  });

  it("残り牌が無ければ undefined を返す", () => {
    expect(generateMentsuSet(makeExhaustedTracker(), WEIGHTS)).toBeUndefined();
  });

  it("牌が足りない面子を引いたら、諦めずに引き直す", () => {
    // 一萬を 2 枚使い切り、一萬の暗刻は確保できない状態にする
    const tracker = new HaiUsageTracker();
    expect(tracker.use(HaiKind.ManZu1, 2).isOk()).toBe(true);
    // 1 回の引きは「種別・么九か・鳴いたか・么九牌のどれか」の 4 値を読む。
    // 刻子だけを引く重みで、1 回目は一萬・2 回目は九萬の暗刻を引く値の列
    const rng = sequenceRandom([0.5, 0.1, 0.9, 0.0, 0.5, 0.1, 0.9, 0.1]);

    const results = generateMentsuSet(
      tracker,
      { shuntsu: 0, koutsu: 1 },
      1,
      rng,
    );

    expect(results?.map((result) => result.mentsu)).toEqual([
      {
        type: MentsuType.Koutsu,
        hais: [HaiKind.ManZu9, HaiKind.ManZu9, HaiKind.ManZu9],
      },
    ]);
  });

  it("生成した面子は順子・刻子・槓子のいずれか", () => {
    const results = generateMentsuSet(new HaiUsageTracker(), WEIGHTS, 4);
    expect(results).toBeDefined();

    for (const { mentsu } of results ?? []) {
      expect([
        MentsuType.Shuntsu,
        MentsuType.Koutsu,
        MentsuType.Kantsu,
      ]).toContain(mentsu.type);
    }
  });
});

describe("pickRonAgariHai", () => {
  /** 同じ牌種の暗刻と暗順子を含む面子リスト（二索の暗刻 + 一二三索） */
  function ambiguousMentsuList(): MentsuResult[] {
    return [
      {
        mentsu: { type: MentsuType.Koutsu, hais: [19, 19, 19] },
        fu: 4,
      },
      {
        mentsu: { type: MentsuType.Shuntsu, hais: [18, 19, 20] },
        fu: 0,
      },
    ];
  }

  it("暗刻と暗順子に跨る牌種は和了牌に選ばない", () => {
    const list = ambiguousMentsuList();
    // 雀頭（一萬）と一二三索の一索・三索だけが候補に残る
    for (let i = 0; i < 100; i++) {
      expect(pickRonAgariHai(list, 0)).not.toBe(19);
    }
  });

  it("跨らない暗刻の牌種は和了牌に選ばれうる（シャンポン待ち）", () => {
    const list: MentsuResult[] = [
      { mentsu: { type: MentsuType.Koutsu, hais: [19, 19, 19] }, fu: 4 },
    ];
    const picked = new Set<number | undefined>();
    for (let i = 0; i < 100; i++) picked.add(pickRonAgariHai(list, 0));

    expect(picked.has(19)).toBe(true);
  });
  it("暗刻の牌種が他の暗面子に無ければ、暗面子がいくつあっても和了牌に選ばれうる", () => {
    // 二索の暗刻・四五六萬・二三四筒 2 つ（一盃口）・一二三索のチー、雀頭は東。
    // 二索はチーの面子にもあるが、副露は和了牌で完成させられないので跨りに数えない。
    // 二筒は 2 つの暗順子にあるが、どちらを完成させても順子の符は変わらない
    const list: MentsuResult[] = [
      { mentsu: koutsu(HaiKind.SouZu2), fu: 4 },
      { mentsu: shuntsu(HaiKind.ManZu4), fu: 0 },
      { mentsu: shuntsu(HaiKind.PinZu2), fu: 0 },
      { mentsu: shuntsu(HaiKind.PinZu2), fu: 0 },
      {
        mentsu: {
          ...shuntsu(HaiKind.SouZu1),
          furo: {
            type: FuroType.Chi,
            from: Tacha.Kamicha,
            nakiHai: HaiKind.SouZu1,
          },
        },
        fu: 0,
      },
    ];
    // 乱数の値を 0 から 1 の手前まで等間隔に振り、選ばれうる和了牌を全部集める
    const picked = new Set<HaiKindId | undefined>();
    for (let step = 0; step < 100; step++) {
      picked.add(pickRonAgariHai(list, HaiKind.Ton, () => step / 100));
    }

    expect(picked).toEqual(
      new Set([
        HaiKind.Ton,
        HaiKind.SouZu2,
        HaiKind.ManZu4,
        HaiKind.ManZu5,
        HaiKind.ManZu6,
        HaiKind.PinZu2,
        HaiKind.PinZu3,
        HaiKind.PinZu4,
      ]),
    );
  });
});

describe("reserveMentsuHais", () => {
  const hai = (value: number): HaiKindId => {
    const result = validateHaiKindId(value);
    if (result.isErr()) throw new Error(`牌種 ${value} が不正`);
    return result.value;
  };

  it("残っていれば全枚数を確保する", () => {
    const tracker = new HaiUsageTracker();
    expect(reserveMentsuHais(tracker, [hai(0), hai(0), hai(0)])).toBe(
      "reserved",
    );
    expect(tracker.canUse(hai(0), 1)).toBe(true);
    expect(tracker.canUse(hai(0), 2)).toBe(false);
  });

  it("同じ牌種が足りなければ 1 枚も使わずに unavailable", () => {
    const tracker = new HaiUsageTracker();
    expect(tracker.use(hai(0), 3).isOk()).toBe(true);
    expect(reserveMentsuHais(tracker, [hai(0), hai(0)])).toBe("unavailable");
    // 2 枚目で足りないことを個別の canUse では見逃す（1 枚ずつなら使える）が、
    // まとめて確かめるので最初の 1 枚も使っていない
    expect(tracker.canUse(hai(0), 1)).toBe(true);
  });
});

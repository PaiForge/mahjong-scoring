import { describe, expect, it } from "vitest";
import { MentsuType, type HaiKindId } from "@pai-forge/riichi-mahjong";

import { HaiUsageTracker } from "../../core/hai-tracker";
import {
  generateMentsuSet,
  generatePairTile,
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
});

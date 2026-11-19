import { describe, it, expect } from "vitest";
import { HaiKind, isYaochu } from "@pai-forge/riichi-mahjong";
import { ALL_HAI_KINDS } from "../../core/constants";
import { HaiUsageTracker } from "../../core/hai-tracker";
import {
  pickAvailableHai,
  randomHaiKindIdExcluding,
  randomSimple,
  randomYaochu,
} from "./tile-random";

describe("pickAvailableHai", () => {
  it("count 枚使えない牌種は候補にしない", () => {
    const tracker = new HaiUsageTracker();
    // 五筒を 2 枚使うと、刻子（3 枚）には五筒を選べない
    expect(tracker.use(HaiKind.PinZu5, 2).isOk()).toBe(true);

    for (let i = 0; i < 500; i++) {
      expect(pickAvailableHai(new HaiUsageTracker(), 4)).toBeDefined();
      const fresh = new HaiUsageTracker();
      expect(fresh.use(HaiKind.PinZu5, 2).isOk()).toBe(true);
      expect(pickAvailableHai(fresh, 3)).not.toBe(HaiKind.PinZu5);
    }
  });

  it("選んだ牌は count 枚使用登録される", () => {
    const tracker = new HaiUsageTracker();
    const hai = pickAvailableHai(tracker, 4);
    expect(hai).toBeDefined();
    if (hai === undefined) return;
    expect(tracker.canUse(hai, 1)).toBe(false);
  });

  it("候補が無ければ undefined を返す", () => {
    const tracker = new HaiUsageTracker();
    for (const hai of ALL_HAI_KINDS) {
      expect(tracker.use(hai, 4).isOk()).toBe(true);
    }
    expect(pickAvailableHai(tracker, 1)).toBeUndefined();
  });
});

describe("randomHaiKindIdExcluding", () => {
  it("除く牌種を引いたら引き直し、除く牌種は返さない", () => {
    // 1 回目は先頭の一萬、2 回目は列の中ほどの牌種を引く値の列
    const values = [0, 0.5];
    let index = 0;
    const hai = randomHaiKindIdExcluding(HaiKind.ManZu1, () => values[index++]);

    expect(hai).toBe(ALL_HAI_KINDS[Math.floor(0.5 * ALL_HAI_KINDS.length)]);
  });
});

describe("randomYaochu", () => {
  it("么九牌（老頭牌・字牌）のどれもが出て、それ以外は出ない", () => {
    // 乱数の値を 0 から 1 の手前まで等間隔に振り、選ばれうる牌を全部集める
    const picked = new Set<number>();
    for (let step = 0; step < 100; step++) {
      picked.add(randomYaochu(() => step / 100));
    }
    expect(picked).toEqual(new Set(ALL_HAI_KINDS.filter(isYaochu)));
  });
});

describe("randomSimple", () => {
  it("中張牌（数牌の 2〜8）のどれもが出て、それ以外は出ない", () => {
    // 1 回目（花色）と 2 回目（数字）の乱数を等間隔に振り、選ばれうる牌を全部集める
    const picked = new Set<number>();
    for (let suit = 0; suit < 3; suit++) {
      for (let step = 0; step < 100; step++) {
        const draws = [suit / 3, step / 100];
        picked.add(randomSimple(() => draws.shift() ?? 0));
      }
    }
    expect(picked).toEqual(
      new Set(ALL_HAI_KINDS.filter((hai) => !isYaochu(hai))),
    );
  });
});

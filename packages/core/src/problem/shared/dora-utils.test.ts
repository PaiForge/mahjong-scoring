import { describe, it, expect } from "vitest";
import {
  HaiKind,
  MentsuType,
  validateTehai14,
} from "@pai-forge/riichi-mahjong";
import type {
  CompletedMentsu,
  HaiKindId,
  Tehai14,
} from "@pai-forge/riichi-mahjong";
import { generateDoraMarkers } from "./dora-utils";

/** 検証済みの手牌を組む（固定値なので失敗しない） */
function tehaiOf(input: {
  readonly closed: readonly HaiKindId[];
  readonly exposed: readonly CompletedMentsu[];
}): Tehai14 {
  const result = validateTehai14({
    closed: [...input.closed],
    exposed: [...input.exposed],
  });
  if (result.isErr()) throw new Error("テスト用の手牌が不正");
  return result.value;
}

/** 123m 456m 789m 234s 55s（槓子なし） */
const NO_KANTSU = tehaiOf({
  closed: [
    HaiKind.ManZu1,
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.ManZu5,
    HaiKind.ManZu6,
    HaiKind.ManZu7,
    HaiKind.ManZu8,
    HaiKind.ManZu9,
    HaiKind.SouZu2,
    HaiKind.SouZu3,
    HaiKind.SouZu4,
    HaiKind.SouZu5,
    HaiKind.SouZu5,
  ],
  exposed: [],
});

/** 123m 456m 789m 22s + 五筒の暗槓（五筒を使い切っている） */
const PINZU5_ANKAN = tehaiOf({
  closed: [
    HaiKind.ManZu1,
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.ManZu5,
    HaiKind.ManZu6,
    HaiKind.ManZu7,
    HaiKind.ManZu8,
    HaiKind.ManZu9,
    HaiKind.SouZu2,
    HaiKind.SouZu2,
  ],
  exposed: [
    {
      type: MentsuType.Kantsu,
      hais: [HaiKind.PinZu5, HaiKind.PinZu5, HaiKind.PinZu5, HaiKind.PinZu5],
    },
  ],
});

/** 123m 456m 789m 22s + 五筒の暗刻（五筒が 1 枚だけ山に残る） */
const PINZU5_KOUTSU = tehaiOf({
  closed: [
    HaiKind.ManZu1,
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.ManZu5,
    HaiKind.ManZu6,
    HaiKind.ManZu7,
    HaiKind.ManZu8,
    HaiKind.ManZu9,
    HaiKind.PinZu5,
    HaiKind.PinZu5,
    HaiKind.PinZu5,
    HaiKind.SouZu2,
    HaiKind.SouZu2,
  ],
  exposed: [],
});

/** 生成できるまで試す（山が尽きることは無いので 1 回で返る） */
function generate(tehai: Tehai14, isRiichi: boolean) {
  const markers = generateDoraMarkers(tehai, isRiichi);
  if (!markers) throw new Error("ドラ表示牌を生成できなかった");
  return markers;
}

describe("generateDoraMarkers", () => {
  it("表示牌の枚数は 1 + 槓子数", () => {
    expect(generate(NO_KANTSU, false).doraMarkers).toHaveLength(1);
    expect(generate(PINZU5_ANKAN, false).doraMarkers).toHaveLength(2);
  });

  it("裏ドラ表示牌はリーチの手だけが持ち、枚数は表ドラと同じ", () => {
    expect(generate(NO_KANTSU, false).uraDoraMarkers).toBeUndefined();
    expect(generate(NO_KANTSU, true).uraDoraMarkers).toHaveLength(1);
    expect(generate(PINZU5_ANKAN, true).uraDoraMarkers).toHaveLength(2);
  });

  it("手牌が使い切った牌種は表示牌に選ばない", () => {
    // 五筒を暗槓した手で五筒がドラ表示牌になると、その牌が5枚要ることになる。
    for (let i = 0; i < 500; i++) {
      const { doraMarkers, uraDoraMarkers } = generate(PINZU5_ANKAN, true);
      expect(doraMarkers).not.toContain(HaiKind.PinZu5);
      expect(uraDoraMarkers).not.toContain(HaiKind.PinZu5);
    }
  });

  it("表ドラと裏ドラを通しても同じ牌種が4枚を超えない", () => {
    // 五筒の暗刻で山には五筒が 1 枚だけ。表ドラに出たら裏ドラには出ない。
    for (let i = 0; i < 2000; i++) {
      const { doraMarkers, uraDoraMarkers = [] } = generate(
        PINZU5_KOUTSU,
        true,
      );
      const pinzu5 = [...doraMarkers, ...uraDoraMarkers].filter(
        (hai) => hai === HaiKind.PinZu5,
      );
      expect(pinzu5.length).toBeLessThanOrEqual(1);
    }
  });
});

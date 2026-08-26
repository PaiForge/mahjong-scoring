import { describe, expect, it } from "vitest";
import { HaiKind } from "@mahjong-scoring/core";

import { splitAgariHai } from "../agari-hai";

/** 234m / 567p / 中中中 / 678s / 南南 */
const CLOSED = [
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.PinZu5,
  HaiKind.PinZu6,
  HaiKind.PinZu7,
  HaiKind.SouZu6,
  HaiKind.SouZu7,
  HaiKind.SouZu8,
  HaiKind.Nan,
  HaiKind.Nan,
  HaiKind.Chun,
  HaiKind.Chun,
  HaiKind.Chun,
];

describe("splitAgariHai", () => {
  it("和了牌を1枚だけ切り離す", () => {
    const { closedTiles, separatedAgariHai } = splitAgariHai(
      CLOSED,
      HaiKind.PinZu7,
    );

    expect(separatedAgariHai).toBe(HaiKind.PinZu7);
    expect(closedTiles).toHaveLength(CLOSED.length - 1);
    expect(closedTiles).not.toContain(HaiKind.PinZu7);
  });

  it("同じ牌が複数あっても1枚しか抜かない", () => {
    const { closedTiles, separatedAgariHai } = splitAgariHai(
      CLOSED,
      HaiKind.Chun,
    );

    expect(separatedAgariHai).toBe(HaiKind.Chun);
    expect(closedTiles.filter((t) => t === HaiKind.Chun)).toHaveLength(2);
  });

  it("抜いた後も残りの並び順は変わらない", () => {
    const { closedTiles } = splitAgariHai(CLOSED, HaiKind.ManZu3);

    expect(closedTiles).toEqual([
      HaiKind.ManZu2,
      HaiKind.ManZu4,
      ...CLOSED.slice(3),
    ]);
  });

  it("和了牌を渡さなければ純手牌をそのまま返す", () => {
    const { closedTiles, separatedAgariHai } = splitAgariHai(CLOSED, undefined);

    expect(separatedAgariHai).toBeUndefined();
    expect(closedTiles).toEqual(CLOSED);
  });

  it("純手牌に無い和了牌でも開示側には残す（出題から和了牌を落とさない）", () => {
    const { closedTiles, separatedAgariHai } = splitAgariHai(
      CLOSED,
      HaiKind.ManZu9,
    );

    expect(separatedAgariHai).toBe(HaiKind.ManZu9);
    expect(closedTiles).toEqual(CLOSED);
  });
});

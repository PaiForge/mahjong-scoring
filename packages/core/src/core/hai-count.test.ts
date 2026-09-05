import { describe, it, expect } from "vitest";
import { HaiKind, type Tehai14 } from "@pai-forge/riichi-mahjong";
import { listTehaiHais, countHaiInTehai } from "./hai-count";

/**
 * 14 枚の手牌を作る。
 *
 * 使用牌の列挙に必要なのは牌の並びだけで、面子として成立しているかは見ない。
 * 各テストが `as unknown as Tehai14` を書くと、その意図が牌の並びに紛れる。
 */
function tehai14(
  closed: readonly HaiKind[],
  exposed: readonly unknown[] = [],
): Tehai14 {
  return { closed, exposed } as unknown as Tehai14;
}

const CLOSED_ONLY = [
  HaiKind.ManZu1,
  HaiKind.ManZu1,
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.PinZu5,
] as const;

/** 明刻（ポン）。副露は 3 枚を持つ */
const PON_SOUZU7 = {
  type: "Koutsu",
  hais: [HaiKind.SouZu7, HaiKind.SouZu7, HaiKind.SouZu7],
  furo: true,
};

/** 暗槓。槓子は 4 枚すべてを持つ */
const KAN_HAKU = {
  type: "Kantsu",
  hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
  furo: false,
};

describe("listTehaiHais", () => {
  it("門前の牌をそのまま並べて返す", () => {
    expect(listTehaiHais(tehai14(CLOSED_ONLY))).toEqual([...CLOSED_ONLY]);
  });

  it("副露の牌も含めて返す", () => {
    expect(listTehaiHais(tehai14(CLOSED_ONLY, [PON_SOUZU7]))).toEqual([
      ...CLOSED_ONLY,
      HaiKind.SouZu7,
      HaiKind.SouZu7,
      HaiKind.SouZu7,
    ]);
  });

  it("槓子は 4 枚とも返す", () => {
    expect(listTehaiHais(tehai14([], [KAN_HAKU]))).toEqual([
      HaiKind.Haku,
      HaiKind.Haku,
      HaiKind.Haku,
      HaiKind.Haku,
    ]);
  });
});

describe("countHaiInTehai", () => {
  it("手牌に無い牌は 0 枚", () => {
    expect(countHaiInTehai(tehai14(CLOSED_ONLY), HaiKind.Chun)).toBe(0);
  });

  it("門前の牌を数える", () => {
    expect(countHaiInTehai(tehai14(CLOSED_ONLY), HaiKind.ManZu1)).toBe(2);
  });

  it("副露の牌も数える", () => {
    const tehai = tehai14(CLOSED_ONLY, [PON_SOUZU7]);

    expect(countHaiInTehai(tehai, HaiKind.SouZu7)).toBe(3);
  });

  it("門前と副露にまたがる牌を合算する", () => {
    const tehai = tehai14([...CLOSED_ONLY, HaiKind.SouZu7], [PON_SOUZU7]);

    expect(countHaiInTehai(tehai, HaiKind.SouZu7)).toBe(4);
  });

  it("槓子は 4 枚として数える", () => {
    expect(countHaiInTehai(tehai14([], [KAN_HAKU]), HaiKind.Haku)).toBe(4);
  });
});

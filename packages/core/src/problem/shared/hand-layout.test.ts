import { describe, it, expect } from "vitest";
import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { orderByHandLayout, type HandLayoutBlock } from "./hand-layout";

interface Block extends HandLayoutBlock {
  readonly name: string;
}

const block = (
  name: string,
  tiles: readonly HaiKindId[],
  isExposed = false,
): Block => ({ name, tiles, isExposed });

const namesOf = (blocks: readonly Block[]) =>
  orderByHandLayout(blocks, (b) => b).map((b) => b.name);

describe("orderByHandLayout", () => {
  it("手の内のブロックを萬子 → 筒子 → 索子 → 字牌の順に並べる", () => {
    expect(
      namesOf([
        block("發", [HaiKind.Hatsu, HaiKind.Hatsu, HaiKind.Hatsu]),
        block("索子", [HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8]),
        block("東", [HaiKind.Ton, HaiKind.Ton]),
        block("筒子", [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6]),
        block("萬子", [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4]),
      ]),
    ).toEqual(["萬子", "筒子", "索子", "東", "發"]);
  });

  it("先頭の牌が同じなら次の牌で比べる", () => {
    expect(
      namesOf([
        block("234m", [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4]),
        block("22m", [HaiKind.ManZu2, HaiKind.ManZu2]),
      ]),
    ).toEqual(["22m", "234m"]);
  });

  it("晒したブロックは手の内の後に元の順で置く", () => {
    expect(
      namesOf([
        block("ポン中", [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun], true),
        block("索子", [HaiKind.SouZu6, HaiKind.SouZu7, HaiKind.SouZu8]),
        block(
          "チー萬子",
          [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
          true,
        ),
        block("筒子", [HaiKind.PinZu4, HaiKind.PinZu5, HaiKind.PinZu6]),
      ]),
    ).toEqual(["筒子", "索子", "ポン中", "チー萬子"]);
  });

  it("同じ牌のブロックは元の順を保つ", () => {
    const tiles = [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4];
    expect(namesOf([block("1つ目", tiles), block("2つ目", tiles)])).toEqual([
      "1つ目",
      "2つ目",
    ]);
  });
});

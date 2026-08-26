import { describe, it, expect } from "vitest";
import { HaiKind, type Tehai } from "@pai-forge/riichi-mahjong";
import { resolveMentsuStructure } from "./mentsu-structure";

/** 副露なしの手牌を作るヘルパー */
function makeTehai(closed: readonly HaiKind[]): Tehai {
  return { closed, exposed: [] };
}

describe("resolveMentsuStructure", () => {
  it("面子手は 4面子1雀頭 の構造を返す", () => {
    // 234m 456p 678s 白白白 + 99m（白の役あり）
    const tehai = makeTehai([
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.PinZu4,
      HaiKind.PinZu5,
      HaiKind.PinZu6,
      HaiKind.SouZu6,
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.Haku,
      HaiKind.Haku,
      HaiKind.Haku,
      HaiKind.ManZu9,
      HaiKind.ManZu9,
    ]);

    const structure = resolveMentsuStructure(tehai, {
      agariHai: HaiKind.ManZu4,
      isTsumo: true,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
    });

    expect(structure).toBeDefined();
    expect(structure?.fourMentsu).toHaveLength(4);
    expect(structure?.jantou.hais).toEqual([HaiKind.ManZu9, HaiKind.ManZu9]);
    // 4面子 + 雀頭で手牌14枚を過不足なく分割している
    const tileCount =
      (structure?.fourMentsu.reduce((sum, m) => sum + m.hais.length, 0) ?? 0) +
      (structure?.jantou.hais.length ?? 0);
    expect(tileCount).toBe(14);
  });

  it("七対子は undefined を返す", () => {
    const tehai = makeTehai([
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu3,
      HaiKind.ManZu3,
      HaiKind.PinZu2,
      HaiKind.PinZu2,
      HaiKind.PinZu4,
      HaiKind.PinZu4,
      HaiKind.SouZu5,
      HaiKind.SouZu5,
      HaiKind.SouZu7,
      HaiKind.SouZu7,
      HaiKind.Haku,
      HaiKind.Haku,
    ]);

    const structure = resolveMentsuStructure(tehai, {
      agariHai: HaiKind.Haku,
      isTsumo: true,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
    });

    expect(structure).toBeUndefined();
  });

  it("国士無双は undefined を返す", () => {
    const tehai = makeTehai([
      HaiKind.ManZu1,
      HaiKind.ManZu9,
      HaiKind.PinZu1,
      HaiKind.PinZu9,
      HaiKind.SouZu1,
      HaiKind.SouZu9,
      HaiKind.Ton,
      HaiKind.Nan,
      HaiKind.Sha,
      HaiKind.Pei,
      HaiKind.Haku,
      HaiKind.Hatsu,
      HaiKind.Chun,
      HaiKind.Chun,
    ]);

    const structure = resolveMentsuStructure(tehai, {
      agariHai: HaiKind.Chun,
      isTsumo: true,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
    });

    expect(structure).toBeUndefined();
  });

  it("14枚でない手牌は undefined を返す", () => {
    const tehai = makeTehai([
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.PinZu4,
      HaiKind.PinZu5,
      HaiKind.PinZu6,
      HaiKind.SouZu6,
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.Haku,
      HaiKind.Haku,
      HaiKind.Haku,
      HaiKind.ManZu9,
    ]);

    const structure = resolveMentsuStructure(tehai, {
      agariHai: HaiKind.ManZu4,
      isTsumo: true,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Nan,
    });

    expect(structure).toBeUndefined();
  });

  it("役なしの手牌は undefined を返す（点数計算の例外を握りつぶす）", () => {
    // 234m 456p 678s 東東東 + 99m のロン和了。東は場風でも自風でもなく役がない
    const tehai = makeTehai([
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.PinZu4,
      HaiKind.PinZu5,
      HaiKind.PinZu6,
      HaiKind.SouZu6,
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.Ton,
      HaiKind.Ton,
      HaiKind.Ton,
      HaiKind.ManZu9,
      HaiKind.ManZu9,
    ]);

    const structure = resolveMentsuStructure(tehai, {
      agariHai: HaiKind.ManZu4,
      isTsumo: false,
      bakaze: HaiKind.Nan,
      jikaze: HaiKind.Sha,
    });

    expect(structure).toBeUndefined();
  });
});

import { describe, it, expect } from "vitest";
import {
  FuroType,
  HaiKind,
  MentsuType,
  Tacha,
  type CompletedMentsu,
  type Tehai,
} from "@pai-forge/riichi-mahjong";
import { resolveMentsuBreakdown } from "./mentsu-structure";

/** 副露なしの手牌を作るヘルパー */
function makeTehai(closed: readonly HaiKind[]): Tehai {
  return { closed, exposed: [] };
}

/** 東場・南家のツモ和了 */
const TSUMO_CONTEXT = {
  isTsumo: true,
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
} as const;

describe("resolveMentsuBreakdown", () => {
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

    const breakdown = resolveMentsuBreakdown(tehai, {
      ...TSUMO_CONTEXT,
      agariHai: HaiKind.ManZu4,
    });

    expect(breakdown).toBeDefined();
    expect(breakdown?.fourMentsu).toHaveLength(4);
    expect(breakdown?.jantou.hais).toEqual([HaiKind.ManZu9, HaiKind.ManZu9]);
    // 4面子 + 雀頭で手牌14枚を過不足なく分割している
    const tileCount =
      (breakdown?.fourMentsu.reduce(
        (sum, row) => sum + row.mentsu.hais.length,
        0,
      ) ?? 0) + (breakdown?.jantou.hais.length ?? 0);
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

    const breakdown = resolveMentsuBreakdown(tehai, {
      ...TSUMO_CONTEXT,
      agariHai: HaiKind.Haku,
    });

    expect(breakdown).toBeUndefined();
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

    const breakdown = resolveMentsuBreakdown(tehai, {
      ...TSUMO_CONTEXT,
      agariHai: HaiKind.Chun,
    });

    expect(breakdown).toBeUndefined();
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

    const breakdown = resolveMentsuBreakdown(tehai, {
      ...TSUMO_CONTEXT,
      agariHai: HaiKind.ManZu4,
    });

    expect(breakdown).toBeUndefined();
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

    const breakdown = resolveMentsuBreakdown(tehai, {
      agariHai: HaiKind.ManZu4,
      isTsumo: false,
      bakaze: HaiKind.Nan,
      jikaze: HaiKind.Sha,
    });

    expect(breakdown).toBeUndefined();
  });

  describe("面子の明暗", () => {
    /** ポンした白の刻子 */
    const PON_HAKU: CompletedMentsu = {
      type: MentsuType.Koutsu,
      hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
      furo: { type: FuroType.Pon, from: Tacha.Toimen },
    };

    it("副露した刻子は明かつ晒され、副露のメタ情報を持つ", () => {
      // 234m 456p 678s + 99m + 白ポン
      const tehai: Tehai = {
        closed: [
          HaiKind.ManZu2,
          HaiKind.ManZu3,
          HaiKind.ManZu4,
          HaiKind.PinZu4,
          HaiKind.PinZu5,
          HaiKind.PinZu6,
          HaiKind.SouZu6,
          HaiKind.SouZu7,
          HaiKind.SouZu8,
          HaiKind.ManZu9,
          HaiKind.ManZu9,
        ],
        exposed: [PON_HAKU],
      };

      const breakdown = resolveMentsuBreakdown(tehai, {
        ...TSUMO_CONTEXT,
        agariHai: HaiKind.ManZu4,
      });

      const haku = breakdown?.fourMentsu.find(
        (row) => row.mentsu.hais[0] === HaiKind.Haku,
      );
      expect(haku?.isOpen).toBe(true);
      expect(haku?.isExposed).toBe(true);
      expect(haku?.mentsu.furo).toEqual(PON_HAKU.furo);
    });

    it("門前ツモの刻子は暗かつ晒されない", () => {
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

      const breakdown = resolveMentsuBreakdown(tehai, {
        ...TSUMO_CONTEXT,
        agariHai: HaiKind.ManZu4,
      });

      const haku = breakdown?.fourMentsu.find(
        (row) => row.mentsu.hais[0] === HaiKind.Haku,
      );
      expect(haku?.isOpen).toBe(false);
      expect(haku?.isExposed).toBe(false);
      expect(haku?.mentsu.furo).toBeUndefined();
    });

    it("ロンで完成した刻子は手牌の中にあっても明として数える", () => {
      // 234m 456p 678s 白白白 + 中中 で白をロン（シャンポン待ち）
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
        HaiKind.Chun,
        HaiKind.Chun,
      ]);

      const breakdown = resolveMentsuBreakdown(tehai, {
        agariHai: HaiKind.Haku,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      const haku = breakdown?.fourMentsu.find(
        (row) => row.mentsu.hais[0] === HaiKind.Haku,
      );
      expect(haku?.isOpen).toBe(true);
      // 明として数えるだけで、牌は手牌の中にある
      expect(haku?.isExposed).toBe(false);
    });

    it("暗槓は暗のまま晒される側に入る", () => {
      // 234m 456p + 99m + 白暗槓 + 中暗刻
      const tehai: Tehai = {
        closed: [
          HaiKind.ManZu2,
          HaiKind.ManZu3,
          HaiKind.ManZu4,
          HaiKind.PinZu4,
          HaiKind.PinZu5,
          HaiKind.PinZu6,
          HaiKind.Chun,
          HaiKind.Chun,
          HaiKind.Chun,
          HaiKind.ManZu9,
          HaiKind.ManZu9,
        ],
        exposed: [
          {
            type: MentsuType.Kantsu,
            hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku, HaiKind.Haku],
          },
        ],
      };

      const breakdown = resolveMentsuBreakdown(tehai, {
        ...TSUMO_CONTEXT,
        agariHai: HaiKind.ManZu4,
      });

      const haku = breakdown?.fourMentsu.find(
        (row) => row.mentsu.hais[0] === HaiKind.Haku,
      );
      expect(haku?.isOpen).toBe(false);
      expect(haku?.isExposed).toBe(true);
    });
  });

  describe("和了牌の位置", () => {
    /** 234m 456p 678s + 中中中 + 白白 をベースにした手牌 */
    const BASE = [
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.PinZu4,
      HaiKind.PinZu5,
      HaiKind.PinZu6,
      HaiKind.SouZu6,
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.Chun,
      HaiKind.Chun,
      HaiKind.Chun,
      HaiKind.Haku,
      HaiKind.Haku,
    ] as const;

    /** 和了牌が付いた面子の牌と、その中での位置 */
    function agariAt(
      breakdown: ReturnType<typeof resolveMentsuBreakdown>,
    ): { hais: readonly HaiKind[]; index: number } | undefined {
      const row = breakdown?.fourMentsu.find(
        (m) => m.agariHaiIndex !== undefined,
      );
      if (row?.agariHaiIndex !== undefined) {
        return { hais: row.mentsu.hais, index: row.agariHaiIndex };
      }
      const jantou = breakdown?.jantou;
      if (jantou?.agariHaiIndex !== undefined) {
        return { hais: jantou.hais, index: jantou.agariHaiIndex };
      }
      return undefined;
    }

    it("嵌張待ちは順子の真ん中に付く", () => {
      const breakdown = resolveMentsuBreakdown(makeTehai(BASE), {
        agariHai: HaiKind.ManZu3,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(agariAt(breakdown)).toEqual({
        hais: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
        index: 1,
      });
    });

    it("両面待ちは順子の端に付く", () => {
      const breakdown = resolveMentsuBreakdown(makeTehai(BASE), {
        ...TSUMO_CONTEXT,
        agariHai: HaiKind.ManZu4,
      });

      expect(agariAt(breakdown)).toEqual({
        hais: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
        index: 2,
      });
    });

    it("単騎待ちは雀頭に付く", () => {
      const breakdown = resolveMentsuBreakdown(makeTehai(BASE), {
        agariHai: HaiKind.Haku,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(breakdown?.jantou.agariHaiIndex).toBe(1);
      expect(
        breakdown?.fourMentsu.every((row) => row.agariHaiIndex === undefined),
      ).toBe(true);
    });

    it("シャンポン待ちは刻子に付き、同じ牌種の順子には付かない", () => {
      // 234m 234m 678s + 中中中 + 白白 で中をロン（シャンポン）
      const tehai = makeTehai([
        HaiKind.ManZu2,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
        HaiKind.ManZu3,
        HaiKind.ManZu4,
        HaiKind.ManZu4,
        HaiKind.SouZu6,
        HaiKind.SouZu7,
        HaiKind.SouZu8,
        HaiKind.Chun,
        HaiKind.Chun,
        HaiKind.Chun,
        HaiKind.Haku,
        HaiKind.Haku,
      ]);

      const breakdown = resolveMentsuBreakdown(tehai, {
        agariHai: HaiKind.Chun,
        isTsumo: false,
        bakaze: HaiKind.Ton,
        jikaze: HaiKind.Nan,
      });

      expect(agariAt(breakdown)).toEqual({
        hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
        index: 2,
      });
    });

    it("和了牌の位置は手牌全体で高々1箇所", () => {
      const breakdown = resolveMentsuBreakdown(makeTehai(BASE), {
        ...TSUMO_CONTEXT,
        agariHai: HaiKind.ManZu4,
      });

      const marked =
        (breakdown?.fourMentsu.filter((row) => row.agariHaiIndex !== undefined)
          .length ?? 0) +
        (breakdown?.jantou.agariHaiIndex === undefined ? 0 : 1);
      expect(marked).toBe(1);
    });

    it("副露した面子には和了牌を付けない", () => {
      // 456p 678s + 99m + 白暗刻 + 234m チー。和了牌は 4m だがチーは対象外
      const tehai: Tehai = {
        closed: [
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
        ],
        exposed: [
          {
            type: MentsuType.Shuntsu,
            hais: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
            furo: { type: FuroType.Chi, from: Tacha.Kamicha },
          },
        ],
      };

      const breakdown = resolveMentsuBreakdown(tehai, {
        ...TSUMO_CONTEXT,
        agariHai: HaiKind.ManZu4,
      });

      const chi = breakdown?.fourMentsu.find((row) => row.isExposed);
      expect(chi?.agariHaiIndex).toBeUndefined();
    });
  });
});

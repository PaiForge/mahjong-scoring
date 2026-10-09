import { describe, it, expect } from "vitest";
import {
  FuroType,
  HaiKind,
  MentsuType,
  Tacha,
  type CompletedMentsu,
  type Tehai,
} from "@pai-forge/riichi-mahjong";
import {
  resolveMentsuBreakdown,
  resolveMentsuBreakdowns,
} from "./mentsu-structure";

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

/** 東場・南家のロン和了 */
const RON_CONTEXT = {
  isTsumo: false,
  bakaze: HaiKind.Ton,
  jikaze: HaiKind.Nan,
} as const;

/**
 * 234m 456p 678s
 *
 * 面子の明暗や和了牌の位置を見るテストは、注目する面子以外を固定したい。
 * この 3 順子を土台にして、ケースごとの差分（刻子・槓子・雀頭）だけを足す。
 */
const THREE_SHUNTSU = [
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.PinZu4,
  HaiKind.PinZu5,
  HaiKind.PinZu6,
  HaiKind.SouZu6,
  HaiKind.SouZu7,
  HaiKind.SouZu8,
] as const;

describe("resolveMentsuBreakdown", () => {
  it("面子手は 4面子1雀頭 の構造を返す", () => {
    // 234m 456p 678s 白白白 + 99m（白の役あり）
    const tehai = makeTehai([
      ...THREE_SHUNTSU,
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
      ...THREE_SHUNTSU,
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
      ...THREE_SHUNTSU,
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
      furo: { type: FuroType.Pon, from: Tacha.Toimen, nakiHai: HaiKind.Haku },
    };

    it("副露した刻子は明かつ晒され、副露のメタ情報を持つ", () => {
      // 234m 456p 678s + 99m + 白ポン
      const tehai: Tehai = {
        closed: [...THREE_SHUNTSU, HaiKind.ManZu9, HaiKind.ManZu9],
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
        ...THREE_SHUNTSU,
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
        ...THREE_SHUNTSU,
        HaiKind.Haku,
        HaiKind.Haku,
        HaiKind.Haku,
        HaiKind.Chun,
        HaiKind.Chun,
      ]);

      const breakdown = resolveMentsuBreakdown(tehai, {
        ...RON_CONTEXT,
        agariHai: HaiKind.Haku,
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
      ...THREE_SHUNTSU,
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
        ...RON_CONTEXT,
        agariHai: HaiKind.ManZu3,
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
        ...RON_CONTEXT,
        agariHai: HaiKind.Haku,
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
        ...RON_CONTEXT,
        agariHai: HaiKind.Chun,
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
            furo: {
              type: FuroType.Chi,
              from: Tacha.Kamicha,
              nakiHai: HaiKind.ManZu2,
            },
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

  describe("面子の並び", () => {
    /** 各面子の先頭の牌（並びの比較用） */
    const leadHais = (tehai: Tehai) =>
      resolveMentsuBreakdown(tehai, {
        ...TSUMO_CONTEXT,
        agariHai: HaiKind.ManZu4,
      })?.fourMentsu.map((row) => row.mentsu.hais[0]);

    it("手牌の並びに依らず萬子 → 筒子 → 索子 → 字牌の順に並べる", () => {
      // 發發發 234m 456p 678s + 99m（理牌していない並びで渡す）
      const tehai = makeTehai([
        HaiKind.Hatsu,
        HaiKind.Hatsu,
        HaiKind.Hatsu,
        ...THREE_SHUNTSU,
        HaiKind.ManZu9,
        HaiKind.ManZu9,
      ]);

      expect(leadHais(tehai)).toEqual([
        HaiKind.ManZu2,
        HaiKind.PinZu4,
        HaiKind.SouZu6,
        HaiKind.Hatsu,
      ]);
    });

    it("副露した面子は手の内の面子の後に並べる", () => {
      // 456p 678s 白白白 99m + 234m チー
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
            furo: {
              type: FuroType.Chi,
              from: Tacha.Kamicha,
              nakiHai: HaiKind.ManZu2,
            },
          },
        ],
      };

      expect(
        resolveMentsuBreakdown(tehai, {
          ...TSUMO_CONTEXT,
          agariHai: HaiKind.PinZu6,
        })?.fourMentsu.map((row) => row.mentsu.hais[0]),
      ).toEqual([HaiKind.PinZu4, HaiKind.SouZu6, HaiKind.Haku, HaiKind.ManZu2]);
    });
  });
});

describe("resolveMentsuBreakdowns", () => {
  /** 345m 345m 55m 123s 456s: 5m は雀頭にも順子にも入る */
  const TWO_WAYS = [
    HaiKind.ManZu3,
    HaiKind.ManZu3,
    HaiKind.ManZu4,
    HaiKind.ManZu4,
    HaiKind.ManZu5,
    HaiKind.ManZu5,
    HaiKind.ManZu5,
    HaiKind.ManZu5,
    HaiKind.SouZu1,
    HaiKind.SouZu2,
    HaiKind.SouZu3,
    HaiKind.SouZu4,
    HaiKind.SouZu5,
    HaiKind.SouZu6,
  ] as const;

  it("和了牌の置き場所ごとの候補を高点法の順に返し、先頭が採用される解釈", () => {
    const candidates = resolveMentsuBreakdowns(makeTehai(TWO_WAYS), {
      ...RON_CONTEXT,
      agariHai: HaiKind.ManZu5,
    });

    // 5m を順子に入れる（平和 + 一盃口 2翻30符）→ 雀頭に入れる（一盃口 1翻40符）
    expect(candidates.map((c) => [c.han, c.fu])).toEqual([
      [2, 30],
      [1, 40],
    ]);
    expect(candidates.map((c) => c.isBest)).toEqual([true, false]);
    expect(candidates[0]?.yakuResult).toEqual([
      ["Pinfu", 1],
      ["Iipeikou", 1],
    ]);

    // 先頭は resolveMentsuBreakdown と同じ
    expect(candidates[0]?.breakdown).toEqual(
      resolveMentsuBreakdown(makeTehai(TWO_WAYS), {
        ...RON_CONTEXT,
        agariHai: HaiKind.ManZu5,
      }),
    );
  });

  it("候補ごとに和了牌の位置が置き場所に従う", () => {
    const [ryanmen, tanki] = resolveMentsuBreakdowns(makeTehai(TWO_WAYS), {
      ...RON_CONTEXT,
      agariHai: HaiKind.ManZu5,
    });

    expect(ryanmen?.breakdown.jantou.agariHaiIndex).toBeUndefined();
    expect(
      ryanmen?.breakdown.fourMentsu.filter(
        (r) => r.agariHaiIndex !== undefined,
      ),
    ).toHaveLength(1);
    expect(tanki?.breakdown.jantou.agariHaiIndex).toBe(1);
  });

  it("候補のキーは置き場所を区別し、順序によらず安定している", () => {
    const candidates = resolveMentsuBreakdowns(makeTehai(TWO_WAYS), {
      ...RON_CONTEXT,
      agariHai: HaiKind.ManZu5,
    });
    const keys = candidates.map((c) => c.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      resolveMentsuBreakdowns(makeTehai(TWO_WAYS), {
        ...RON_CONTEXT,
        agariHai: HaiKind.ManZu5,
      }).map((c) => c.key),
    );
  });

  it("和了牌を刻子に入れた解釈では刻子が明、順子に入れた解釈では暗になる", () => {
    // 222m 234m 555z 678s 33s の 2m ロン
    const tehai = makeTehai([
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.Haku,
      HaiKind.Haku,
      HaiKind.Haku,
      HaiKind.SouZu6,
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.SouZu3,
      HaiKind.SouZu3,
    ]);
    const candidates = resolveMentsuBreakdowns(tehai, {
      ...RON_CONTEXT,
      agariHai: HaiKind.ManZu2,
    });
    const koutsuRow = (i: number) =>
      candidates[i]?.breakdown.fourMentsu.find(
        (r) =>
          r.mentsu.type === MentsuType.Koutsu &&
          r.mentsu.hais[0] === HaiKind.ManZu2,
      );

    expect(candidates.map((c) => c.fu)).toEqual([50, 40]);
    expect(koutsuRow(0)?.isOpen).toBe(false);
    expect(koutsuRow(1)?.isOpen).toBe(true);
  });

  it("翻・符が違っても支払いが同じ候補はすべて最高点として印が付く", () => {
    // 345m 55m 999p 666s 111z の 5m ロン、ドラ表示牌 8p（ドラ 9p ×3）
    //   単騎: 場風 + 三暗刻 + ドラ3 = 6翻60符、両面: 6翻50符。どちらも跳満 12000 点
    const candidates = resolveMentsuBreakdowns(
      makeTehai([
        HaiKind.ManZu3,
        HaiKind.ManZu4,
        HaiKind.ManZu5,
        HaiKind.ManZu5,
        HaiKind.ManZu5,
        HaiKind.PinZu9,
        HaiKind.PinZu9,
        HaiKind.PinZu9,
        HaiKind.SouZu6,
        HaiKind.SouZu6,
        HaiKind.SouZu6,
        HaiKind.Ton,
        HaiKind.Ton,
        HaiKind.Ton,
      ]),
      {
        ...RON_CONTEXT,
        agariHai: HaiKind.ManZu5,
        doraMarkers: [HaiKind.PinZu8],
      },
    );

    expect(candidates.map((c) => [c.han, c.fu])).toEqual([
      [6, 60],
      [6, 50],
    ]);
    expect(candidates.map((c) => c.isBest)).toEqual([true, true]);
  });

  it("同点の候補はすべて最高点として印が付く", () => {
    // 111m 123m 999p 555s 66z の 1m ツモ: どちらに入れても 3翻50符
    const tehai = makeTehai([
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.PinZu9,
      HaiKind.PinZu9,
      HaiKind.PinZu9,
      HaiKind.SouZu5,
      HaiKind.SouZu5,
      HaiKind.SouZu5,
      HaiKind.Hatsu,
      HaiKind.Hatsu,
    ]);
    const candidates = resolveMentsuBreakdowns(tehai, {
      ...TSUMO_CONTEXT,
      agariHai: HaiKind.ManZu1,
    });

    expect(candidates).toHaveLength(2);
    expect(candidates.every((c) => c.isBest)).toBe(true);
  });

  it("ドラで翻数が上がると順位が変わりうるため、ドラ表示牌を順位に反映する", () => {
    // 345m 345m 55m 123s 456s の 5m ロン、ドラ 3 つ（表示牌 2m → ドラ 3m ×2、
    // 表示牌 4m → ドラ 5m ×4 ではなく、翻数を揃えて満貫で頭打ちにする）
    // ドラ表示牌 1s → ドラ 2s（1 つ）、2s → 3s（1 つ）、4m → 5m（4 つ）: 計 6 つ
    //   順子に入れる: 2 + 6 = 8翻 → 倍満（16000）
    //   雀頭に入れる: 1 + 6 = 7翻 → 跳満（12000）
    // 順位は変わらないが、翻数にドラが乗っていることを確かめる
    const candidates = resolveMentsuBreakdowns(makeTehai(TWO_WAYS), {
      ...RON_CONTEXT,
      agariHai: HaiKind.ManZu5,
      doraMarkers: [HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.ManZu4],
    });

    expect(candidates.map((c) => c.han)).toEqual([8, 7]);
  });

  it("リーチしている手では立直の 1 翻と裏ドラを候補の翻数と支払いに乗せる", () => {
    // 345m 345m 55m 123s 456s の 5m ロン、リーチ、裏ドラ表示牌 2s（裏ドラ 3s ×1）
    //   順子に入れる: 平和 + 一盃口 + 立直 + 裏ドラ1 = 4翻30符 7700
    //   雀頭に入れる: 一盃口 + 立直 + 裏ドラ1 = 3翻40符 5200
    const candidates = resolveMentsuBreakdowns(makeTehai(TWO_WAYS), {
      ...RON_CONTEXT,
      agariHai: HaiKind.ManZu5,
      isRiichi: true,
      uraDoraMarkers: [HaiKind.SouZu2],
    });

    expect(candidates.map((c) => [c.han, c.fu, c.payment])).toEqual([
      [4, 30, { type: "ron", amount: 7700 }],
      [3, 40, { type: "ron", amount: 5200 }],
    ]);
  });

  it("役満の手にはリーチもドラも乗せず、翻数を役満の翻に揃える", () => {
    // 111m 222p 333s 444z + 55m の 5m ツモ（四暗刻の単騎）、リーチ、ドラ表示牌 4m（ドラ 5m ×2）
    const candidates = resolveMentsuBreakdowns(
      makeTehai([
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.ManZu1,
        HaiKind.PinZu2,
        HaiKind.PinZu2,
        HaiKind.PinZu2,
        HaiKind.SouZu3,
        HaiKind.SouZu3,
        HaiKind.SouZu3,
        HaiKind.Pei,
        HaiKind.Pei,
        HaiKind.Pei,
        HaiKind.ManZu5,
        HaiKind.ManZu5,
      ]),
      {
        ...TSUMO_CONTEXT,
        agariHai: HaiKind.ManZu5,
        isRiichi: true,
        doraMarkers: [HaiKind.ManZu4],
        uraDoraMarkers: [HaiKind.ManZu4],
      },
    );

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.han).toBe(13);
    expect(candidates[0]?.payment).toEqual({
      type: "koTsumo",
      amount: [8000, 16000],
    });
  });

  it("ルール設定（連風牌の雀頭符）を候補の符に反映する", () => {
    // 東場・東家、111m 123m 999p 678s 11z の 1m ツモ
    //   20 + ツモ2 + 111m 8 + 999p 8 + 連風牌の雀頭（2 or 4）= 40 or 42 -> 40符 or 50符
    const tehai = makeTehai([
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.PinZu9,
      HaiKind.PinZu9,
      HaiKind.PinZu9,
      HaiKind.SouZu6,
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.Ton,
      HaiKind.Ton,
    ]);
    const context = {
      isTsumo: true,
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Ton,
      agariHai: HaiKind.ManZu1,
    } as const;

    expect(resolveMentsuBreakdowns(tehai, context).map((c) => c.fu)).toEqual([
      40, 40,
    ]);
    expect(
      resolveMentsuBreakdowns(tehai, {
        ...context,
        ruleConfig: { doubleWindJantouFu: 4 },
      }).map((c) => c.fu),
    ).toEqual([50, 50]);
  });

  it("面子手でない解釈は候補に入らず、成立する和了が無ければ空配列", () => {
    const chiitoitsu = makeTehai([
      HaiKind.ManZu1,
      HaiKind.ManZu1,
      HaiKind.ManZu3,
      HaiKind.ManZu3,
      HaiKind.PinZu5,
      HaiKind.PinZu5,
      HaiKind.PinZu7,
      HaiKind.PinZu7,
      HaiKind.SouZu2,
      HaiKind.SouZu2,
      HaiKind.SouZu9,
      HaiKind.SouZu9,
      HaiKind.Ton,
      HaiKind.Ton,
    ]);
    expect(
      resolveMentsuBreakdowns(chiitoitsu, {
        ...RON_CONTEXT,
        agariHai: HaiKind.Ton,
      }),
    ).toEqual([]);

    // 234m 234p 456s 678s 55z は役なし
    const yakunashi = makeTehai([
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.PinZu2,
      HaiKind.PinZu3,
      HaiKind.PinZu4,
      HaiKind.SouZu4,
      HaiKind.SouZu5,
      HaiKind.SouZu6,
      HaiKind.SouZu6,
      HaiKind.SouZu7,
      HaiKind.SouZu8,
      HaiKind.Haku,
      HaiKind.Haku,
    ]);
    expect(
      resolveMentsuBreakdowns(yakunashi, {
        ...RON_CONTEXT,
        agariHai: HaiKind.ManZu4,
      }),
    ).toEqual([]);
  });
});

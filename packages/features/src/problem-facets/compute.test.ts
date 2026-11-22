import { describe, expect, it } from "vitest";

import {
  eligibleAgariPayload,
  kazoeYakumanAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
  renfonpaiAgariPayload,
  yakumanAgariPayload,
} from "../daily-problem/test-fixtures";

import { computeProblemFacets, type ScoredFacetRow } from "./compute";
import {
  agariInput,
  daisuushiiAgariPayload,
  fukugouYakumanAgariPayload,
  junseiChuurenAgariPayload,
  kiriageOnlyWithRenfonpaiAgariPayload,
  kokushiJuusanmenAgariPayload,
  mixedKiriageTenpaiPayload,
  noYakuAgariPayload,
  noYakuRonTenpaiPayload,
  riichiTenpaiPayload,
  singleWaitTenpaiPayload,
  suuankouTankiAgariPayload,
  tenpaiInput,
  tripleYakumanAgariPayload,
} from "./test-fixtures";

/** 和了形の 1 行（採点済み）を取り出す。形が違えばテストの書き間違い */
function onlyScoredRow(
  facets: ReturnType<typeof computeProblemFacets>,
): ScoredFacetRow {
  const [row, ...rest] = facets.rows;
  if (!row || rest.length > 0 || row.result !== "scored") {
    throw new Error("expected exactly one scored row");
  }
  return row;
}

function variesOf(row: ScoredFacetRow) {
  return {
    renfonpai: row.variesByRenfonpai,
    kiriage: row.variesByKiriage,
    yakumanRules: row.variesByYakumanRules,
  };
}

describe("computeProblemFacets（和了形）", () => {
  it("和了 1 つを 1 行にし、標準ルールの正解と盤面に共通の属性を入れる", () => {
    expect(computeProblemFacets(agariInput(eligibleAgariPayload()))).toEqual({
      set: {
        status: "ok",
        isOya: false,
        isMenzen: true,
        isRiichi: true,
        kanCount: 0,
        jikaze: 29,
        bakaze: 27,
        waitCount: null,
      },
      rows: [
        {
          agariHai: 22,
          isTsumo: true,
          result: "scored",
          han: 2,
          fu: 30,
          scoreLevel: "Normal",
          yakumanMultiplier: 0,
          points: 2000,
          yaku: ["MenzenTsumo", "Riichi"],
          doraHan: 0,
          uraDoraHan: 0,
          machi: "Kanchan",
          variesByRenfonpai: false,
          variesByKiriage: false,
          variesByYakumanRules: false,
        },
      ],
    });
  });

  it("役にドラを含めず、ドラの翻は別に持つ", () => {
    const row = onlyScoredRow(
      computeProblemFacets(agariInput(otherEligibleAgariPayload())),
    );
    expect(row.yaku).toEqual(["Haku", "MenzenTsumo"]);
    expect(row.han).toBe(3);
    expect(row.doraHan).toBe(1);
  });

  it("点数は和了者の収入の合計（親ツモは 3 人分・子ツモは子 2 人 + 親・ロンは支払い）", () => {
    // 親ツモ 3 翻 30 符 = 2000 オール
    expect(
      onlyScoredRow(
        computeProblemFacets(agariInput(otherEligibleAgariPayload())),
      ).points,
    ).toBe(6000);
    // 子ツモ 4 翻 30 符 = 2000 / 3900
    expect(
      onlyScoredRow(
        computeProblemFacets(agariInput(kiriageBoundaryAgariPayload())),
      ).points,
    ).toBe(7900);
    // 親ロン 3 翻 50 符
    expect(
      onlyScoredRow(
        computeProblemFacets(
          agariInput(kiriageOnlyWithRenfonpaiAgariPayload()),
        ),
      ).points,
    ).toBe(9600);
  });

  it("30 符 4 翻は切り上げ満貫の印だけが立つ", () => {
    const row = onlyScoredRow(
      computeProblemFacets(agariInput(kiriageBoundaryAgariPayload())),
    );
    expect([row.han, row.fu, row.scoreLevel]).toEqual([4, 30, "Normal"]);
    expect(variesOf(row)).toEqual({
      renfonpai: false,
      kiriage: true,
      yakumanRules: false,
    });
  });

  it("連風牌の雀頭でも、切り上げ後の符が同じなら印は立たない（36 符と 38 符はどちらも 40 符）", () => {
    const row = onlyScoredRow(
      computeProblemFacets(agariInput(renfonpaiAgariPayload())),
    );
    expect(row.fu).toBe(40);
    expect(variesOf(row)).toEqual({
      renfonpai: false,
      kiriage: false,
      yakumanRules: false,
    });
  });

  it("連風牌 4 符のときにだけ切り上げが効く手は、連風牌と切り上げ満貫の両方の印が立つ", () => {
    const row = onlyScoredRow(
      computeProblemFacets(agariInput(kiriageOnlyWithRenfonpaiAgariPayload())),
    );
    // 標準ルールでは 3 翻 50 符。切り上げ満貫だけを切り替えても変わらない
    expect([row.han, row.fu]).toEqual([3, 50]);
    expect(variesOf(row)).toEqual({
      renfonpai: true,
      kiriage: true,
      yakumanRules: false,
    });
  });

  it("役満はルールで変わらなければ印が立たず、単騎の四暗刻は役満ルールの印が立つ", () => {
    const shanpon = onlyScoredRow(
      computeProblemFacets(agariInput(yakumanAgariPayload())),
    );
    expect([shanpon.scoreLevel, shanpon.yakumanMultiplier]).toEqual([
      "Yakuman",
      1,
    ]);
    expect(shanpon.yaku).toEqual(["Suuankou"]);
    expect(variesOf(shanpon)).toEqual({
      renfonpai: false,
      kiriage: false,
      yakumanRules: false,
    });

    const tanki = onlyScoredRow(
      computeProblemFacets(agariInput(suuankouTankiAgariPayload())),
    );
    expect(tanki.machi).toBe("Tanki");
    expect(variesOf(tanki)).toEqual({
      renfonpai: false,
      kiriage: false,
      yakumanRules: true,
    });
  });

  it("役満ルールを有効にすると組み立てられなくなる手も、役満ルールの印が立つ", () => {
    const facets = computeProblemFacets(
      agariInput(tripleYakumanAgariPayload()),
    );
    expect(facets.set.status).toBe("ok");
    expect(variesOf(onlyScoredRow(facets))).toEqual({
      renfonpai: false,
      kiriage: false,
      yakumanRules: true,
    });
  });

  it.each([
    ["複合の合算（大三元 + 四暗刻）", fukugouYakumanAgariPayload],
    ["大四喜のダブル役満", daisuushiiAgariPayload],
    ["国士無双十三面のダブル役満", kokushiJuusanmenAgariPayload],
    ["純正九蓮宝燈のダブル役満", junseiChuurenAgariPayload],
  ])(
    "役満ルールのうち %s だけで変わる手にも、役満ルールの印が立つ",
    (_name, payload) => {
      const row = onlyScoredRow(computeProblemFacets(agariInput(payload())));
      // 標準ルールでは役満 1 つ分
      expect([row.scoreLevel, row.yakumanMultiplier, row.points]).toEqual([
        "Yakuman",
        1,
        32000,
      ]);
      expect(variesOf(row)).toEqual({
        renfonpai: false,
        kiriage: false,
        yakumanRules: true,
      });
    },
  );

  it("数え役満は役満の区分で、役満の倍数は 0", () => {
    const row = onlyScoredRow(
      computeProblemFacets(agariInput(kazoeYakumanAgariPayload())),
    );
    expect([row.han, row.scoreLevel, row.yakumanMultiplier]).toEqual([
      14,
      "Yakuman",
      0,
    ]);
  });
});

describe("computeProblemFacets（聴牌形）", () => {
  it("待ち × ツモ/ロンの行にし、役が無いロンは noYaku として残す", () => {
    const facets = computeProblemFacets(tenpaiInput(noYakuRonTenpaiPayload()));
    expect(facets.set).toEqual({
      status: "ok",
      isOya: false,
      isMenzen: true,
      isRiichi: false,
      kanCount: 0,
      jikaze: 28,
      bakaze: 27,
      waitCount: 2,
    });
    expect(
      facets.rows.map((row) => [
        row.agariHai,
        row.isTsumo,
        row.result,
        row.result === "scored" ? row.fu : null,
      ]),
    ).toEqual([
      [20, true, "scored", 30],
      [20, false, "noYaku", null],
      [26, true, "scored", 40],
      [26, false, "noYaku", null],
    ]);
    expect(facets.rows[1]).toEqual({
      agariHai: 20,
      isTsumo: false,
      result: "noYaku",
    });
  });

  it("ツモとロンで翻・符・役が違う和了を別の行に持つ", () => {
    const facets = computeProblemFacets(tenpaiInput(riichiTenpaiPayload()));
    expect(facets.set).toMatchObject({
      status: "ok",
      isOya: true,
      isRiichi: true,
      waitCount: 3,
    });
    expect(facets.rows.map((row) => [row.agariHai, row.isTsumo])).toEqual([
      [10, true],
      [10, false],
      [13, true],
      [13, false],
      [16, true],
      [16, false],
    ]);
    const [tsumo, ron] = facets.rows;
    expect(tsumo).toMatchObject({
      han: 4,
      fu: 20,
      points: 7800,
      yaku: ["Tanyao", "Pinfu", "MenzenTsumo", "Riichi"],
      machi: "Ryanmen",
    });
    expect(ron).toMatchObject({
      han: 3,
      fu: 30,
      points: 5800,
      yaku: ["Tanyao", "Pinfu", "Riichi"],
    });
  });
});

describe("computeProblemFacets（聴牌形の印）", () => {
  it("印は和了ごとに付ける（同じ聴牌形でも、ドラの待ちのロンだけが切り上げ満貫で変わる）", () => {
    const facets = computeProblemFacets(
      tenpaiInput(mixedKiriageTenpaiPayload()),
    );
    expect(
      facets.rows.map((row) =>
        row.result === "scored"
          ? [row.agariHai, row.isTsumo, row.han, row.fu, row.variesByKiriage]
          : row.result,
      ),
    ).toEqual([
      [20, true, 4, 20, false],
      [20, false, 3, 30, false],
      [23, true, 5, 20, false],
      [23, false, 4, 30, true],
    ]);
  });
});

describe("computeProblemFacets（計算できない盤面）", () => {
  it("標準ルールで組み立てられない盤面は、理由を持つ failed の親だけにする", () => {
    expect(computeProblemFacets(agariInput(noYakuAgariPayload()))).toEqual({
      set: { status: "failed", error: "noYaku" },
      rows: [],
    });
    expect(
      computeProblemFacets(tenpaiInput(singleWaitTenpaiPayload())),
    ).toEqual({ set: { status: "failed", error: "tooFewWaits" }, rows: [] });
  });

  it("保存形式として読めない盤面は invalidPayload にする", () => {
    const invalid = {
      set: { status: "failed", error: "invalidPayload" },
      rows: [],
    };
    // 未知の種別
    expect(
      computeProblemFacets({
        ...agariInput(eligibleAgariPayload()),
        kind: "yaku-han",
      }),
    ).toEqual(invalid);
    // 未対応の版
    expect(
      computeProblemFacets({
        ...agariInput(eligibleAgariPayload()),
        schemaVersion: 2,
      }),
    ).toEqual(invalid);
    // 形が違う
    expect(
      computeProblemFacets({
        kind: "agari-score",
        schemaVersion: 1,
        payload: { hand: null },
      }),
    ).toEqual(invalid);
    // 形は合うが、盤面として成り立たない（表ドラ表示牌が 1 + 槓子数でない）
    expect(
      computeProblemFacets(
        agariInput({ ...eligibleAgariPayload(), doraMarkers: [32, 33] }),
      ),
    ).toEqual(invalid);
  });
});

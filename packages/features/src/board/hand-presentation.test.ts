import { describe, expect, it } from "vitest";
import { compareNumbers, HaiKind, type HaiKindId } from "@mahjong-scoring/core";

import { PlanBenefit } from "../billing/plans";
import { splitAgariHai } from "./agari-hai";
import {
  buildHandPresentation,
  DEFAULT_HAND_PRESENTATION_SETTINGS,
  presentTehai,
  resolveHandPresentationSettings,
  validateHandPresentation,
  type HandPresentation,
  type HandPresentationSnapshot,
} from "./hand-presentation";

/** 赤 5 萬（core の赤牌の値） */
const AKA_MANZU5 = 34 as HaiKindId;

/** 234m 555m(赤含む) 567p 678s 南南 — 和了牌は南 */
const CLOSED: readonly HaiKindId[] = [
  HaiKind.ManZu2,
  HaiKind.ManZu3,
  HaiKind.ManZu4,
  HaiKind.ManZu5,
  AKA_MANZU5,
  HaiKind.ManZu5,
  HaiKind.PinZu5,
  HaiKind.PinZu6,
  HaiKind.PinZu7,
  HaiKind.SouZu6,
  HaiKind.SouZu7,
  HaiKind.SouZu8,
  HaiKind.Nan,
  HaiKind.Nan,
];

const SPLIT = splitAgariHai(CLOSED, HaiKind.Nan);

const RANDOM: HandPresentationSnapshot = {
  orientation: "random",
  order: "sorted",
  sessionSeed: 12345,
};
const UPRIGHT: HandPresentationSnapshot = {
  orientation: "upright",
  order: "sorted",
  sessionSeed: 12345,
};
const RANDOM_UNSORTED: HandPresentationSnapshot = {
  ...RANDOM,
  order: "unsorted",
};

/** 置換になっているか（重複・欠落なし） */
function isPermutation(order: readonly number[], length: number): boolean {
  return (
    order.length === length &&
    [...order].sort(compareNumbers).every((value, index) => value === index)
  );
}

describe("resolveHandPresentationSettings", () => {
  const PRO_WISH = { orientation: "random", order: "unsorted" } as const;

  it("practice_tools があれば向きも並べ方も保存値どおり", () => {
    expect(
      resolveHandPresentationSettings(PRO_WISH, [PlanBenefit.PracticeTools]),
    ).toEqual(PRO_WISH);
    expect(
      resolveHandPresentationSettings(
        { orientation: "upright", order: "unsorted" },
        [PlanBenefit.PracticeTools],
      ),
    ).toEqual({ orientation: "upright", order: "unsorted" });
    expect(
      resolveHandPresentationSettings(
        { orientation: "random", order: "sorted" },
        [PlanBenefit.PracticeTools],
      ),
    ).toEqual({ orientation: "random", order: "sorted" });
  });

  it.each([
    { name: "両方", saved: PRO_WISH },
    { name: "向きだけ", saved: { orientation: "random", order: "sorted" } },
    {
      name: "並べ方だけ",
      saved: { orientation: "upright", order: "unsorted" },
    },
  ] as const)("特典が無ければ $name 希望していても両方既定", ({ saved }) => {
    expect(resolveHandPresentationSettings(saved, [])).toEqual(
      DEFAULT_HAND_PRESENTATION_SETTINGS,
    );
    expect(
      resolveHandPresentationSettings(saved, [PlanBenefit.UnlimitedPractice]),
    ).toEqual(DEFAULT_HAND_PRESENTATION_SETTINGS);
  });

  it("既定は特典に関わらず既定", () => {
    expect(
      resolveHandPresentationSettings(DEFAULT_HAND_PRESENTATION_SETTINGS, [
        PlanBenefit.PracticeTools,
      ]),
    ).toEqual({ orientation: "upright", order: "sorted" });
  });
});

describe("buildHandPresentation", () => {
  it("upright + sorted は従来の表示（恒等置換・すべて正規の向き）", () => {
    const presentation = buildHandPresentation(SPLIT, UPRIGHT);
    expect(presentation.closedOrder).toEqual(
      SPLIT.closedTiles.map((_, index) => index),
    );
    expect(presentation.closedInverted.every((value) => !value)).toBe(true);
    expect(presentation.agariInverted).toBe(false);
    expect(presentTehai(SPLIT, presentation)).toEqual(
      presentTehai(SPLIT, undefined),
    );
  });

  it("空の手牌・和了牌なしを扱える", () => {
    const empty = splitAgariHai([], undefined);
    const presentation = buildHandPresentation(empty, RANDOM_UNSORTED);
    expect(presentation).toEqual({
      closedOrder: [],
      closedInverted: [],
      agariInverted: false,
    });
  });

  it("和了牌が無い手牌（聴牌形）は純手牌すべてが対象で、和了牌は逆さにしない", () => {
    const tenpai = splitAgariHai(CLOSED.slice(0, 13), undefined);
    const presentation = buildHandPresentation(tenpai, RANDOM);
    expect(presentation.closedOrder).toHaveLength(13);
    expect(presentation.closedInverted).toHaveLength(13);
    expect(presentation.agariInverted).toBe(false);
  });

  it("副露で純手牌が短くても実際の長さを使う", () => {
    const short = splitAgariHai(CLOSED.slice(0, 8), HaiKind.ManZu5);
    const presentation = buildHandPresentation(short, RANDOM_UNSORTED);
    expect(short.closedTiles).toHaveLength(7);
    expect(isPermutation(presentation.closedOrder, 7)).toBe(true);
    expect(presentation.closedInverted).toHaveLength(7);
  });

  it("同じ種・同じ値の別オブジェクトなら同じ結果", () => {
    const copy = splitAgariHai([...CLOSED], HaiKind.Nan);
    expect(buildHandPresentation(copy, RANDOM)).toEqual(
      buildHandPresentation(SPLIT, RANDOM),
    );
    expect(buildHandPresentation(copy, { ...RANDOM_UNSORTED })).toEqual(
      buildHandPresentation(SPLIT, RANDOM_UNSORTED),
    );
  });

  it("種 0 も有効な種として扱う", () => {
    const zero = {
      orientation: "random",
      order: "unsorted",
      sessionSeed: 0,
    } as const;
    expect(buildHandPresentation(SPLIT, zero)).toEqual(
      buildHandPresentation(SPLIT, zero),
    );
  });

  it("赤 5 と通常の 5 を区別して入力種を作る", () => {
    // 赤を通常の 5 に正規化していれば、すべての種で一致してしまう
    const normalized = splitAgariHai(
      CLOSED.map((hai) => (hai === AKA_MANZU5 ? HaiKind.ManZu5 : hai)),
      HaiKind.Nan,
    );
    const differs = Array.from({ length: 32 }, (_, seed) => seed).some(
      (sessionSeed) => {
        const snapshot = {
          orientation: "random",
          order: "sorted",
          sessionSeed,
        } as const;
        return (
          JSON.stringify(buildHandPresentation(SPLIT, snapshot)) !==
          JSON.stringify(buildHandPresentation(normalized, snapshot))
        );
      },
    );
    expect(differs).toBe(true);
  });

  it("和了牌の有無を入力種に含める（純手牌が同じでも和了牌の分離で別の手）", () => {
    const withoutAgari = {
      closedTiles: SPLIT.closedTiles,
      separatedAgariHai: undefined,
    };
    const differs = Array.from({ length: 32 }, (_, seed) => seed).some(
      (sessionSeed) => {
        const snapshot = {
          orientation: "random",
          order: "sorted",
          sessionSeed,
        } as const;
        return (
          JSON.stringify(
            buildHandPresentation(SPLIT, snapshot).closedInverted,
          ) !==
          JSON.stringify(
            buildHandPresentation(withoutAgari, snapshot).closedInverted,
          )
        );
      },
    );
    expect(differs).toBe(true);
  });

  it("unsorted は完全な置換で、元の配列を変えない", () => {
    const before = [...SPLIT.closedTiles];
    for (let sessionSeed = 0; sessionSeed < 20; sessionSeed++) {
      const presentation = buildHandPresentation(SPLIT, {
        orientation: "upright",
        order: "unsorted",
        sessionSeed,
      });
      expect(isPermutation(presentation.closedOrder, 13)).toBe(true);
      const presented = presentTehai(SPLIT, presentation);
      expect(presented.closed.map((tile) => tile.hai).sort()).toEqual(
        [...SPLIT.closedTiles].sort(),
      );
    }
    expect(SPLIT.closedTiles).toEqual(before);
  });

  it("並べ方を変えても向きの系列は変わらない", () => {
    for (let sessionSeed = 0; sessionSeed < 20; sessionSeed++) {
      const sorted = buildHandPresentation(SPLIT, { ...RANDOM, sessionSeed });
      const unsorted = buildHandPresentation(SPLIT, {
        ...RANDOM_UNSORTED,
        sessionSeed,
      });
      expect(unsorted.closedInverted).toEqual(sorted.closedInverted);
      expect(unsorted.agariInverted).toBe(sorted.agariInverted);
    }
  });

  it("向きを変えても並べ方の系列は変わらない", () => {
    for (let sessionSeed = 0; sessionSeed < 20; sessionSeed++) {
      const upright = buildHandPresentation(SPLIT, {
        orientation: "upright",
        order: "unsorted",
        sessionSeed,
      });
      const random = buildHandPresentation(SPLIT, {
        ...RANDOM_UNSORTED,
        sessionSeed,
      });
      expect(random.closedOrder).toEqual(upright.closedOrder);
    }
  });

  it("sorted は向きに関わらず恒等置換", () => {
    expect(buildHandPresentation(SPLIT, RANDOM).closedOrder).toEqual(
      SPLIT.closedTiles.map((_, index) => index),
    );
  });

  it("unsorted は理牌と違う並びになりうる（固定の種で確かめる）", () => {
    const presentation = buildHandPresentation(SPLIT, RANDOM_UNSORTED);
    expect(presentation.closedOrder).not.toEqual(
      SPLIT.closedTiles.map((_, index) => index),
    );
  });

  it("random の向きは表示位置ごとの真偽値", () => {
    const presentation = buildHandPresentation(SPLIT, RANDOM);
    expect(presentation.closedInverted).toHaveLength(13);
    expect(
      presentation.closedInverted.every((value) => typeof value === "boolean"),
    ).toBe(true);
    expect(validateHandPresentation(SPLIT, presentation)).toEqual({ ok: true });
  });
});

describe("validateHandPresentation / presentTehai", () => {
  const valid = buildHandPresentation(SPLIT, RANDOM_UNSORTED);
  const identity = SPLIT.closedTiles.map((_, index) => index);
  const allUpright = SPLIT.closedTiles.map(() => false);

  const cases: readonly {
    readonly name: string;
    readonly presentation: HandPresentation;
    readonly error: string;
  }[] = [
    {
      name: "置換が短い",
      presentation: { ...valid, closedOrder: identity.slice(1) },
      error: "orderLength",
    },
    {
      name: "範囲外の添字",
      presentation: { ...valid, closedOrder: [...identity.slice(1), 13] },
      error: "orderIndex",
    },
    {
      name: "負の添字",
      presentation: { ...valid, closedOrder: [-1, ...identity.slice(1)] },
      error: "orderIndex",
    },
    {
      name: "整数でない添字",
      presentation: { ...valid, closedOrder: [0.5, ...identity.slice(1)] },
      error: "orderIndex",
    },
    {
      name: "重複（= 欠落）",
      presentation: { ...valid, closedOrder: [0, ...identity.slice(0, 12)] },
      error: "orderDuplicate",
    },
    {
      name: "向きの配列長が違う",
      presentation: { ...valid, closedInverted: allUpright.slice(1) },
      error: "invertedLength",
    },
    {
      name: "向きに真偽値でない値",
      presentation: {
        ...valid,
        closedInverted: [1, ...allUpright.slice(1)] as unknown as boolean[],
      },
      error: "invertedValue",
    },
    {
      name: "和了牌の向きが真偽値でない",
      presentation: {
        ...valid,
        agariInverted: "yes" as unknown as boolean,
      },
      error: "agariInvertedValue",
    },
  ];

  it.each(cases)(
    "$name は全体を既定の表示に戻す",
    ({ presentation, error }) => {
      expect(validateHandPresentation(SPLIT, presentation)).toEqual({
        ok: false,
        error,
      });
      expect(presentTehai(SPLIT, presentation)).toEqual(
        presentTehai(SPLIT, undefined),
      );
    },
  );

  it("和了牌が無いのに和了牌を逆さにする指定は拒否する", () => {
    const tenpai = splitAgariHai(CLOSED.slice(0, 13), undefined);
    const presentation: HandPresentation = {
      closedOrder: tenpai.closedTiles.map((_, index) => index),
      closedInverted: tenpai.closedTiles.map(() => false),
      agariInverted: true,
    };
    expect(validateHandPresentation(tenpai, presentation)).toEqual({
      ok: false,
      error: "agariInvertedWithoutAgari",
    });
    expect(presentTehai(tenpai, presentation).agari).toBeUndefined();
  });

  it("正しい見せ方は並びと向きをそのまま適用する", () => {
    const presentation: HandPresentation = {
      closedOrder: [...identity].reverse(),
      closedInverted: identity.map((index) => index === 0),
      agariInverted: true,
    };
    const presented = presentTehai(SPLIT, presentation);
    expect(presented.closed[0]).toEqual({
      hai: SPLIT.closedTiles[12],
      inverted: true,
    });
    expect(presented.closed[1]?.inverted).toBe(false);
    expect(presented.agari).toEqual({ hai: HaiKind.Nan, inverted: true });
  });
});

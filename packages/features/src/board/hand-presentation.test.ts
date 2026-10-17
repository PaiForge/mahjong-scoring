import { describe, expect, it } from "vitest";
import { compareNumbers, HaiKind, type HaiKindId } from "@mahjong-scoring/core";

import { PlanBenefit } from "../billing/plans";
import { splitAgariHai } from "./agari-hai";
import {
  buildHandPresentation,
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
  sessionSeed: 12345,
};
const UPRIGHT: HandPresentationSnapshot = {
  orientation: "upright",
  sessionSeed: 12345,
};

/** 置換になっているか（重複・欠落なし） */
function isPermutation(order: readonly number[], length: number): boolean {
  return (
    order.length === length &&
    [...order].sort(compareNumbers).every((value, index) => value === index)
  );
}

describe("resolveHandPresentationSettings", () => {
  it("random は practice_tools があるときだけ有効", () => {
    expect(
      resolveHandPresentationSettings("random", [PlanBenefit.PracticeTools]),
    ).toEqual({ orientation: "random" });
    expect(resolveHandPresentationSettings("random", [])).toEqual({
      orientation: "upright",
    });
    expect(
      resolveHandPresentationSettings("random", [
        PlanBenefit.UnlimitedPractice,
      ]),
    ).toEqual({ orientation: "upright" });
  });

  it("upright は特典に関わらず upright", () => {
    expect(
      resolveHandPresentationSettings("upright", [PlanBenefit.PracticeTools]),
    ).toEqual({ orientation: "upright" });
  });
});

describe("buildHandPresentation", () => {
  it("upright + sorted は従来の表示（恒等置換・すべて正規の向き）", () => {
    const presentation = buildHandPresentation(SPLIT, UPRIGHT, "sorted");
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
    const presentation = buildHandPresentation(empty, RANDOM, "unsorted");
    expect(presentation).toEqual({
      closedOrder: [],
      closedInverted: [],
      agariInverted: false,
    });
  });

  it("和了牌が無い手牌（聴牌形）は純手牌すべてが対象で、和了牌は逆さにしない", () => {
    const tenpai = splitAgariHai(CLOSED.slice(0, 13), undefined);
    const presentation = buildHandPresentation(tenpai, RANDOM, "sorted");
    expect(presentation.closedOrder).toHaveLength(13);
    expect(presentation.closedInverted).toHaveLength(13);
    expect(presentation.agariInverted).toBe(false);
  });

  it("副露で純手牌が短くても実際の長さを使う", () => {
    const short = splitAgariHai(CLOSED.slice(0, 8), HaiKind.ManZu5);
    const presentation = buildHandPresentation(short, RANDOM, "unsorted");
    expect(short.closedTiles).toHaveLength(7);
    expect(isPermutation(presentation.closedOrder, 7)).toBe(true);
    expect(presentation.closedInverted).toHaveLength(7);
  });

  it("同じ種・同じ値の別オブジェクトなら同じ結果", () => {
    const copy = splitAgariHai([...CLOSED], HaiKind.Nan);
    expect(buildHandPresentation(copy, RANDOM, "sorted")).toEqual(
      buildHandPresentation(SPLIT, RANDOM, "sorted"),
    );
    expect(buildHandPresentation(copy, { ...RANDOM }, "unsorted")).toEqual(
      buildHandPresentation(SPLIT, RANDOM, "unsorted"),
    );
  });

  it("種 0 も有効な種として扱う", () => {
    const zero = { orientation: "random", sessionSeed: 0 } as const;
    expect(buildHandPresentation(SPLIT, zero, "sorted")).toEqual(
      buildHandPresentation(SPLIT, zero, "sorted"),
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
        const snapshot = { orientation: "random", sessionSeed } as const;
        return (
          JSON.stringify(buildHandPresentation(SPLIT, snapshot, "sorted")) !==
          JSON.stringify(buildHandPresentation(normalized, snapshot, "sorted"))
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
        const snapshot = { orientation: "random", sessionSeed } as const;
        return (
          JSON.stringify(
            buildHandPresentation(SPLIT, snapshot, "sorted").closedInverted,
          ) !==
          JSON.stringify(
            buildHandPresentation(withoutAgari, snapshot, "sorted")
              .closedInverted,
          )
        );
      },
    );
    expect(differs).toBe(true);
  });

  it("unsorted は完全な置換で、元の配列を変えない", () => {
    const before = [...SPLIT.closedTiles];
    for (let sessionSeed = 0; sessionSeed < 20; sessionSeed++) {
      const presentation = buildHandPresentation(
        SPLIT,
        { orientation: "upright", sessionSeed },
        "unsorted",
      );
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
      const snapshot = { orientation: "random", sessionSeed } as const;
      const sorted = buildHandPresentation(SPLIT, snapshot, "sorted");
      const unsorted = buildHandPresentation(SPLIT, snapshot, "unsorted");
      expect(unsorted.closedInverted).toEqual(sorted.closedInverted);
      expect(unsorted.agariInverted).toBe(sorted.agariInverted);
    }
  });

  it("random の向きは表示位置ごとの真偽値", () => {
    const presentation = buildHandPresentation(SPLIT, RANDOM, "sorted");
    expect(presentation.closedInverted).toHaveLength(13);
    expect(
      presentation.closedInverted.every((value) => typeof value === "boolean"),
    ).toBe(true);
    expect(validateHandPresentation(SPLIT, presentation)).toEqual({ ok: true });
  });
});

describe("validateHandPresentation / presentTehai", () => {
  const valid = buildHandPresentation(SPLIT, RANDOM, "unsorted");
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

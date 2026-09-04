import { describe, it, expect } from "vitest";
import {
  HaiKind,
  MentsuType,
  type Tehai14,
  type ScoreResult,
  type Kazehai,
} from "@pai-forge/riichi-mahjong";
import { reconcileYakuhai, applyRiichiAndUraDora } from "./reconciler";

/**
 * テスト用の ScoreResult を構築するヘルパー
 */
function makeScoreResult(overrides: Partial<ScoreResult> = {}): ScoreResult {
  return {
    han: 1,
    fu: 30,
    scoreLevel: "Normal",
    payment: { type: "ron", amount: 1000 },
    ...overrides,
  } as ScoreResult;
}

/**
 * テスト用の門前手牌（刻子含む）を構築するヘルパー
 */
function makeTehaiWithKoutsu(koutsuHai: number, closedRest: number[]): Tehai14 {
  return {
    closed: [koutsuHai, koutsuHai, koutsuHai, ...closedRest],
    exposed: [],
  } as unknown as Tehai14;
}

/**
 * 刻子以外の3面子（123m/123p/123s）と雀頭を並べた残り11牌
 *
 * どのテストも「刻子1つ + 通常の3面子 + 雀頭」の手牌を使い、
 * 検証したいのは刻子の種類と雀頭だけ。定型部分をここにまとめる。
 */
function standardRest(jantou: number): number[] {
  return [
    HaiKind.ManZu1,
    HaiKind.ManZu2,
    HaiKind.ManZu3,
    HaiKind.PinZu1,
    HaiKind.PinZu2,
    HaiKind.PinZu3,
    HaiKind.SouZu1,
    HaiKind.SouZu2,
    HaiKind.SouZu3,
    jantou,
    jantou,
  ];
}

/** ライブラリの役検出結果（{@link reconcileYakuhai} への入力） */
interface DetectedYaku {
  readonly yakuResult: readonly (readonly [string, number])[];
  readonly yakuDetails: readonly {
    readonly name: string;
    readonly han: number;
  }[];
}

/** ライブラリが役を1つも検出していない状態 */
const NONE_DETECTED: DetectedYaku = { yakuResult: [], yakuDetails: [] };

/** ライブラリが「役牌 白」を1翻だけ検出済みの状態 */
const HAKU_DETECTED: DetectedYaku = {
  yakuResult: [["Haku", 1]],
  yakuDetails: [{ name: "役牌 白", han: 1 }],
};

/** ライブラリが「断么九」を1翻だけ検出済みの状態 */
const TANYAO_DETECTED: DetectedYaku = {
  yakuResult: [["Tanyao", 1]],
  yakuDetails: [{ name: "断么九", han: 1 }],
};

/**
 * 既定の場風・自風（東場・南家）で役牌の照合を行う
 *
 * どのテストもロン和了で、風を上書きするのは連風の検証だけ。定型の引数7つを
 * ここにまとめ、各テストは手牌と検出済みの役に集中する。
 *
 * @param han - 照合前にライブラリが出した翻数
 * @param kaze - 場風・自風の上書き（既定は東場・南家）
 */
function reconcile(
  tehai: Tehai14,
  detected: DetectedYaku,
  han: number,
  kaze: { readonly bakaze?: Kazehai; readonly jikaze?: Kazehai } = {},
) {
  return reconcileYakuhai({
    tehai,
    yakuResult: detected.yakuResult,
    answer: makeScoreResult({ han }),
    bakaze: kaze.bakaze ?? HaiKind.Ton,
    jikaze: kaze.jikaze ?? HaiKind.Nan,
    isTsumo: false,
  });
}

describe("reconcileYakuhai", () => {
  it("役牌が既にライブラリで検出済みの場合、翻数を変更しない", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Haku, standardRest(HaiKind.Ton));
    const result = reconcile(tehai, HAKU_DETECTED, 1);

    expect(result.answer.han).toBe(1);
  });

  it("場風牌が未検出の場合、1翻追加される", () => {
    // 場風: 東、自風: 南。手牌に東の刻子があるがライブラリ未検出
    const tehai = makeTehaiWithKoutsu(HaiKind.Ton, standardRest(HaiKind.Haku));
    const result = reconcile(tehai, HAKU_DETECTED, 1);

    expect(result.answer.han).toBe(2);
    expect(result.additionalYakuDetails).toContainEqual({
      name: "場風牌",
      han: 1,
    });
  });

  it("自風牌が未検出の場合、1翻追加される", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Nan, standardRest(HaiKind.Haku));
    const result = reconcile(tehai, HAKU_DETECTED, 1);

    expect(result.answer.han).toBe(2);
    expect(result.additionalYakuDetails).toContainEqual({
      name: "自風牌",
      han: 1,
    });
  });

  it("連風牌（場風=自風）が未検出の場合、2翻追加される", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Ton, standardRest(HaiKind.Haku));
    const result = reconcile(tehai, HAKU_DETECTED, 1, {
      bakaze: HaiKind.Ton,
      jikaze: HaiKind.Ton,
    });

    expect(result.answer.han).toBe(3);
    expect(result.additionalYakuDetails).toContainEqual({
      name: "連風牌",
      han: 2,
    });
  });

  it("三元牌（發）が未検出の場合、1翻追加される", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Hatsu, standardRest(HaiKind.Ton));
    const result = reconcile(tehai, NONE_DETECTED, 0);

    expect(result.answer.han).toBe(1);
    expect(result.additionalYakuDetails).toContainEqual({
      name: "役牌 發",
      han: 1,
    });
  });

  it("三元牌（中）が未検出の場合、1翻追加される", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Chun, standardRest(HaiKind.Ton));
    const result = reconcile(tehai, NONE_DETECTED, 0);

    expect(result.answer.han).toBe(1);
    expect(result.additionalYakuDetails).toContainEqual({
      name: "役牌 中",
      han: 1,
    });
  });

  it("複数の役牌が同時に未検出の場合、すべて追加される", () => {
    // 白と發の両方が刻子だがライブラリ未検出
    const tehai: Tehai14 = {
      closed: [
        HaiKind.Haku,
        HaiKind.Haku,
        HaiKind.Haku,
        HaiKind.Hatsu,
        HaiKind.Hatsu,
        HaiKind.Hatsu,
        HaiKind.ManZu1,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
        HaiKind.PinZu1,
        HaiKind.PinZu2,
        HaiKind.PinZu3,
        HaiKind.Ton,
        HaiKind.Ton,
      ],
      exposed: [],
    } as unknown as Tehai14;

    const result = reconcile(tehai, NONE_DETECTED, 0);

    expect(result.answer.han).toBe(2);
    expect(result.additionalYakuDetails).toContainEqual({
      name: "役牌 白",
      han: 1,
    });
    expect(result.additionalYakuDetails).toContainEqual({
      name: "役牌 發",
      han: 1,
    });
  });

  it("副露に含まれる役牌もカウントされる", () => {
    const tehai: Tehai14 = {
      closed: standardRest(HaiKind.Ton),
      exposed: [
        {
          type: MentsuType.Koutsu,
          hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
          furo: true,
        },
      ],
    } as unknown as Tehai14;

    const result = reconcile(tehai, NONE_DETECTED, 0);

    expect(result.answer.han).toBe(1);
    expect(result.additionalYakuDetails).toContainEqual({
      name: "役牌 中",
      han: 1,
    });
  });

  it("役牌がない場合、翻数を変更しない", () => {
    const tehai: Tehai14 = {
      closed: [
        HaiKind.ManZu1,
        HaiKind.ManZu2,
        HaiKind.ManZu3,
        HaiKind.ManZu4,
        HaiKind.ManZu5,
        HaiKind.ManZu6,
        HaiKind.PinZu1,
        HaiKind.PinZu2,
        HaiKind.PinZu3,
        HaiKind.SouZu1,
        HaiKind.SouZu2,
        HaiKind.SouZu3,
        HaiKind.SouZu7,
        HaiKind.SouZu7,
      ],
      exposed: [],
    } as unknown as Tehai14;

    const result = reconcile(tehai, TANYAO_DETECTED, 1);

    expect(result.answer.han).toBe(1);
  });
});

describe("applyRiichiAndUraDora", () => {
  /** 白の暗刻 + 123m/123p/123s + 東の雀頭（門前・14牌） */
  function makeRiichiTehai(): Tehai14 {
    return makeTehaiWithKoutsu(HaiKind.Haku, standardRest(HaiKind.Ton));
  }

  /** 手牌に1枚も当たらない裏ドラ表示牌（索子8 → ドラは索子9） */
  const NO_HIT_MARKER = HaiKind.SouZu8;

  it("立直で1翻が加算される", () => {
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [NO_HIT_MARKER],
      isDoubleRiichi: false,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.answer.han).toBe(2);
    expect(result.additionalYakuDetails).toEqual([{ name: "立直", han: 1 }]);
  });

  it("ダブル立直で2翻が加算される", () => {
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [NO_HIT_MARKER],
      isDoubleRiichi: true,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.answer.han).toBe(3);
    expect(result.additionalYakuDetails).toEqual([
      { name: "ダブル立直", han: 2 },
    ]);
  });

  it("裏ドラ翻数が表示牌と手牌の照合結果に一致する", () => {
    // 中の表示牌 → ドラは白（三元牌はループする）。手牌は白の暗刻なので3枚。
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [HaiKind.Chun],
      isDoubleRiichi: false,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.additionalYakuDetails).toEqual([
      { name: "立直", han: 1 },
      { name: "裏ドラ", han: 3 },
    ]);
    expect(result.answer.han).toBe(1 + 1 + 3);
  });

  it("表示牌が複数（槓子あり）の場合も全ての表示牌を照合する", () => {
    // 1m の表示牌 → ドラは 2m（手牌に1枚）、中の表示牌 → ドラは白（3枚）
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [HaiKind.ManZu1, HaiKind.Chun],
      isDoubleRiichi: false,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.additionalYakuDetails).toContainEqual({
      name: "裏ドラ",
      han: 4,
    });
    expect(result.answer.han).toBe(1 + 1 + 4);
  });

  it("裏ドラが乗らない場合は裏ドラの役詳細を含めない", () => {
    const result = applyRiichiAndUraDora({
      tehai: makeRiichiTehai(),
      currentAnswer: makeScoreResult({ han: 1 }),
      uraDoraMarkers: [NO_HIT_MARKER],
      isDoubleRiichi: false,
      isTsumo: false,
      jikaze: HaiKind.Nan,
    });

    expect(result.additionalYakuDetails.some((d) => d.name === "裏ドラ")).toBe(
      false,
    );
  });
});

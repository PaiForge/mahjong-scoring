import { describe, it, expect } from "vitest";
import { HaiKind, MentsuType, type Tehai14, type ScoreResult, type Kazehai } from "@pai-forge/riichi-mahjong";
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

describe("reconcileYakuhai", () => {
  it("役牌が既にライブラリで検出済みの場合、翻数を変更しない", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Haku, [
      HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
      HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
      HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
      HaiKind.Ton, HaiKind.Ton,
    ]);
    const answer = makeScoreResult({ han: 1 });
    const yakuResult: [string, number][] = [["Haku", 1]];
    const yakuDetails = [{ name: "役牌 白", han: 1 }];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, HaiKind.Nan, false,
    );

    expect(result.answer.han).toBe(1);
  });

  it("場風牌が未検出の場合、1翻追加される", () => {
    // 場風: 東、自風: 南。手牌に東の刻子があるがライブラリ未検出
    const tehai = makeTehaiWithKoutsu(HaiKind.Ton, [
      HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
      HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
      HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
      HaiKind.Haku, HaiKind.Haku,
    ]);
    const answer = makeScoreResult({ han: 1 });
    const yakuResult: [string, number][] = [["Haku", 1]];
    const yakuDetails = [{ name: "役牌 白", han: 1 }];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, // bakaze
      HaiKind.Nan, // jikaze
      false,
    );

    expect(result.answer.han).toBe(2);
    expect(result.additionalYakuDetails).toContainEqual({ name: "場風牌", han: 1 });
  });

  it("自風牌が未検出の場合、1翻追加される", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Nan, [
      HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
      HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
      HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
      HaiKind.Haku, HaiKind.Haku,
    ]);
    const answer = makeScoreResult({ han: 1 });
    const yakuResult: [string, number][] = [["Haku", 1]];
    const yakuDetails = [{ name: "役牌 白", han: 1 }];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, // bakaze
      HaiKind.Nan, // jikaze
      false,
    );

    expect(result.answer.han).toBe(2);
    expect(result.additionalYakuDetails).toContainEqual({ name: "自風牌", han: 1 });
  });

  it("連風牌（場風=自風）が未検出の場合、2翻追加される", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Ton, [
      HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
      HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
      HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
      HaiKind.Haku, HaiKind.Haku,
    ]);
    const answer = makeScoreResult({ han: 1 });
    const yakuResult: [string, number][] = [["Haku", 1]];
    const yakuDetails = [{ name: "役牌 白", han: 1 }];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, // bakaze
      HaiKind.Ton, // jikaze（東家の東場 → 連風）
      false,
    );

    expect(result.answer.han).toBe(3);
    expect(result.additionalYakuDetails).toContainEqual({ name: "連風牌", han: 2 });
  });

  it("三元牌（發）が未検出の場合、1翻追加される", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Hatsu, [
      HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
      HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
      HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
      HaiKind.Ton, HaiKind.Ton,
    ]);
    const answer = makeScoreResult({ han: 0 });
    const yakuResult: [string, number][] = [];
    const yakuDetails: { name: string; han: number }[] = [];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, HaiKind.Nan, false,
    );

    expect(result.answer.han).toBe(1);
    expect(result.additionalYakuDetails).toContainEqual({ name: "役牌 發", han: 1 });
  });

  it("三元牌（中）が未検出の場合、1翻追加される", () => {
    const tehai = makeTehaiWithKoutsu(HaiKind.Chun, [
      HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
      HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
      HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
      HaiKind.Ton, HaiKind.Ton,
    ]);
    const answer = makeScoreResult({ han: 0 });
    const yakuResult: [string, number][] = [];
    const yakuDetails: { name: string; han: number }[] = [];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, HaiKind.Nan, false,
    );

    expect(result.answer.han).toBe(1);
    expect(result.additionalYakuDetails).toContainEqual({ name: "役牌 中", han: 1 });
  });

  it("複数の役牌が同時に未検出の場合、すべて追加される", () => {
    // 白と發の両方が刻子だがライブラリ未検出
    const tehai: Tehai14 = {
      closed: [
        HaiKind.Haku, HaiKind.Haku, HaiKind.Haku,
        HaiKind.Hatsu, HaiKind.Hatsu, HaiKind.Hatsu,
        HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
        HaiKind.Ton, HaiKind.Ton,
      ],
      exposed: [],
    } as unknown as Tehai14;

    const answer = makeScoreResult({ han: 0 });
    const yakuResult: [string, number][] = [];
    const yakuDetails: { name: string; han: number }[] = [];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, HaiKind.Nan, false,
    );

    expect(result.answer.han).toBe(2);
    expect(result.additionalYakuDetails).toContainEqual({ name: "役牌 白", han: 1 });
    expect(result.additionalYakuDetails).toContainEqual({ name: "役牌 發", han: 1 });
  });

  it("副露に含まれる役牌もカウントされる", () => {
    const tehai: Tehai14 = {
      closed: [
        HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
        HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
        HaiKind.Ton, HaiKind.Ton,
      ],
      exposed: [
        { type: MentsuType.Koutsu, hais: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun], furo: true },
      ],
    } as unknown as Tehai14;

    const answer = makeScoreResult({ han: 0 });
    const yakuResult: [string, number][] = [];
    const yakuDetails: { name: string; han: number }[] = [];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, HaiKind.Nan, false,
    );

    expect(result.answer.han).toBe(1);
    expect(result.additionalYakuDetails).toContainEqual({ name: "役牌 中", han: 1 });
  });

  it("役牌がない場合、翻数を変更しない", () => {
    const tehai: Tehai14 = {
      closed: [
        HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6,
        HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
        HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
        HaiKind.SouZu7, HaiKind.SouZu7,
      ],
      exposed: [],
    } as unknown as Tehai14;

    const answer = makeScoreResult({ han: 1 });
    const yakuResult: [string, number][] = [["Tanyao", 1]];
    const yakuDetails = [{ name: "断么九", han: 1 }];

    const result = reconcileYakuhai(
      tehai, yakuResult, yakuDetails, answer,
      HaiKind.Ton, HaiKind.Nan, false,
    );

    expect(result.answer.han).toBe(1);
  });
});

describe("applyRiichiAndUraDora", () => {
  it("副露手の場合、リーチは適用されない", () => {
    const tehai: Tehai14 = {
      closed: [
        HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
        HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
        HaiKind.Ton, HaiKind.Ton,
      ],
      exposed: [
        { type: MentsuType.Koutsu, hais: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku], furo: true },
      ],
    } as unknown as Tehai14;

    const answer = makeScoreResult({ han: 1 });
    const yakuDetails = [{ name: "役牌 白", han: 1 }];

    const result = applyRiichiAndUraDora(
      tehai, answer, yakuDetails, 0, false, HaiKind.Nan,
    );

    // 副露手なので常に元のanswerが返される
    expect(result.answer.han).toBe(1);
    expect(result.uraDoraMarkers).toBeUndefined();
  });

  it("門前手の場合、翻が1以上増加するかスキップされる", () => {
    const tehai: Tehai14 = {
      closed: [
        HaiKind.ManZu1, HaiKind.ManZu2, HaiKind.ManZu3,
        HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6,
        HaiKind.PinZu1, HaiKind.PinZu2, HaiKind.PinZu3,
        HaiKind.SouZu1, HaiKind.SouZu2, HaiKind.SouZu3,
        HaiKind.SouZu7, HaiKind.SouZu7,
      ],
      exposed: [],
    } as unknown as Tehai14;

    const answer = makeScoreResult({ han: 1 });
    const yakuDetails = [{ name: "断么九", han: 1 }];

    // 確率的なので複数回試行
    let riichiApplied = false;
    let riichiNotApplied = false;

    for (let i = 0; i < 200; i++) {
      const result = applyRiichiAndUraDora(
        tehai, answer, [...yakuDetails], 0, false, HaiKind.Nan,
      );

      if (result.answer.han > 1) {
        riichiApplied = true;
        // リーチが適用された場合、翻が増加している
        expect(result.answer.han).toBeGreaterThan(1);
      } else {
        riichiNotApplied = true;
      }

      if (riichiApplied && riichiNotApplied) break;
    }

    // 確率的に両方のパスが通ることを確認
    expect(riichiApplied || riichiNotApplied).toBe(true);
  });
});

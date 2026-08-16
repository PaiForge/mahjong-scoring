import {
  HaiKind,
  type HaiKindId,
  type Tehai14,
  type Kazehai,
  type ScoreResult,
} from "@pai-forge/riichi-mahjong";
import type { YakuDetail } from "../types";
import { recalculateScore } from "../../../score/calculator";
import { countDoraInTehai } from "../../../core/dora";
import { countHaiInTehai } from "../../../core/hai-count";
import { getKeyForKazehai, isOya } from "../../../core/kaze";

/**
 * 役牌照合の結果
 * 役牌照合結果
 */
interface ReconcileYakuhaiResult {
  readonly answer: ScoreResult;
  readonly additionalYakuDetails: readonly YakuDetail[];
}

/**
 * 役牌照合ロジック
 * ライブラリの判定結果と手牌の実態を比較し、不足分があれば修正する
 * 役牌照合
 */
export function reconcileYakuhai(
  tehai: Tehai14,
  yakuResult: readonly (readonly [string, number])[],
  yakuDetails: readonly YakuDetail[],
  answer: ScoreResult,
  bakaze: Kazehai,
  jikaze: Kazehai,
  isTsumo: boolean,
): ReconcileYakuhaiResult {
  let extraYakuhaiHan = 0;
  const additionalYakuDetails: YakuDetail[] = [];

  const hasDoubleWind = yakuResult.some(
    (y) => y[0] === "ダブ東" || y[0] === "ダブ南",
  );
  const hasBakaze = yakuResult.some(
    (y) => y[0] === "場風牌" || y[0] === getKeyForKazehai(bakaze),
  );
  const hasJikaze = yakuResult.some(
    (y) => y[0] === "自風牌" || y[0] === getKeyForKazehai(jikaze),
  );

  if (bakaze === jikaze) {
    if (!hasDoubleWind && countHaiInTehai(tehai, bakaze) >= 3) {
      extraYakuhaiHan += 2;
      additionalYakuDetails.push({ name: "連風牌", han: 2 });
    }
  } else {
    if (!hasBakaze && countHaiInTehai(tehai, bakaze) >= 3) {
      extraYakuhaiHan += 1;
      additionalYakuDetails.push({ name: "場風牌", han: 1 });
    }
    if (!hasJikaze && countHaiInTehai(tehai, jikaze) >= 3) {
      extraYakuhaiHan += 1;
      additionalYakuDetails.push({ name: "自風牌", han: 1 });
    }
  }

  // 三元牌チェック
  const dragons: readonly {
    readonly id: HaiKindId;
    readonly name: string;
    readonly key: string;
  }[] = [
    { id: HaiKind.Haku, name: "役牌 白", key: "Haku" },
    { id: HaiKind.Hatsu, name: "役牌 發", key: "Hatsu" },
    { id: HaiKind.Chun, name: "役牌 中", key: "Chun" },
  ];

  for (const { id, name, key } of dragons) {
    const hasDragon = yakuResult.some((y) => y[0] === key);
    if (!hasDragon && countHaiInTehai(tehai, id) >= 3) {
      extraYakuhaiHan += 1;
      additionalYakuDetails.push({ name, han: 1 });
    }
  }

  if (extraYakuhaiHan > 0) {
    const newHan = answer.han + extraYakuhaiHan;
    const newAnswer = recalculateScore(answer, newHan, {
      isTsumo,
      isOya: isOya(jikaze),
    });
    return { answer: newAnswer, additionalYakuDetails };
  }

  return { answer, additionalYakuDetails };
}

/**
 * リーチ・裏ドラ適用の結果
 * リーチ裏ドラ適用結果
 */
interface ApplyRiichiResult {
  readonly answer: ScoreResult;
  readonly additionalYakuDetails: readonly YakuDetail[];
}

/**
 * リーチ・裏ドラを適用した点数を求める
 * リーチ裏ドラ適用
 *
 * 「リーチを適用する」ことが確定した手牌にのみ呼ぶ純粋関数。
 * 門前判定・リーチ有無・ダブル立直・裏ドラ表示牌の抽選は呼び出し側の責務とし、
 * この関数は与えられた条件から翻数と点数を導出するだけに留める
 * （出題側の乱数とこの関数の乱数が二重に走る構造を避けるため）。
 */
export function applyRiichiAndUraDora(input: {
  readonly tehai: Tehai14;
  readonly currentAnswer: ScoreResult;
  /** 裏ドラ表示牌（呼び出し側で generateDoraMarkers して渡す） */
  readonly uraDoraMarkers: readonly HaiKindId[];
  readonly isDoubleRiichi: boolean;
  readonly isTsumo: boolean;
  readonly jikaze: Kazehai;
}): ApplyRiichiResult {
  const {
    tehai,
    currentAnswer,
    uraDoraMarkers,
    isDoubleRiichi,
    isTsumo,
    jikaze,
  } = input;

  const riichiHan = isDoubleRiichi ? 2 : 1;
  const riichiName = isDoubleRiichi ? "ダブル立直" : "立直";

  // 裏ドラ翻数は表示牌から手牌を照合して算出する（表示牌と翻数の不一致を防ぐ）
  const uraHan = countDoraInTehai(tehai, uraDoraMarkers);

  const additionalYakuDetails: readonly YakuDetail[] = [
    { name: riichiName, han: riichiHan },
    ...(uraHan > 0 ? [{ name: "裏ドラ", han: uraHan }] : []),
  ];

  const newHan = currentAnswer.han + riichiHan + uraHan;
  const answer = recalculateScore(currentAnswer, newHan, {
    isTsumo,
    isOya: isOya(jikaze),
  });

  return { answer, additionalYakuDetails };
}

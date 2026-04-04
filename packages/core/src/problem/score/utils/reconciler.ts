import {
  HaiKind,
  type HaiKindId,
  type Tehai14,
  type Kazehai,
  type ScoreResult,
} from "@pai-forge/riichi-mahjong";
import type { YakuDetail } from "../types";
import { recalculateScore } from "../../../score/calculator";
import { getKeyForKazehai } from "../../../core/hai-names";
import { isHaiKindId } from "../../../core/type-guards";
import { countHaiInTehai } from "../../shared/hai-count";

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

  const hasDoubleWind = yakuResult.some((y) => y[0] === "ダブ東" || y[0] === "ダブ南");
  const hasBakaze = yakuResult.some((y) => y[0] === "場風牌" || y[0] === getKeyForKazehai(bakaze));
  const hasJikaze = yakuResult.some((y) => y[0] === "自風牌" || y[0] === getKeyForKazehai(jikaze));

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
  const dragons: readonly { readonly id: number; readonly name: string; readonly key: string }[] = [
    { id: HaiKind.Haku, name: "役牌 白", key: "Haku" },
    { id: HaiKind.Hatsu, name: "役牌 發", key: "Hatsu" },
    { id: HaiKind.Chun, name: "役牌 中", key: "Chun" },
  ];

  for (const { id, name, key } of dragons) {
    const hasDragon = yakuResult.some((y) => y[0] === key);
    if (!hasDragon && isHaiKindId(id) && countHaiInTehai(tehai, id) >= 3) {
      extraYakuhaiHan += 1;
      additionalYakuDetails.push({ name, han: 1 });
    }
  }

  if (extraYakuhaiHan > 0) {
    const newHan = answer.han + extraYakuhaiHan;
    const newAnswer = recalculateScore(answer, newHan, {
      isTsumo,
      isOya: jikaze === HaiKind.Ton,
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
  readonly uraDoraMarkers: HaiKindId[] | undefined;
  readonly additionalYakuDetails: readonly YakuDetail[];
}

/**
 * リーチ・裏ドラの適用
 * リーチ裏ドラ適用
 */
export function applyRiichiAndUraDora(
  tehai: Tehai14,
  currentAnswer: ScoreResult,
  yakuDetails: readonly YakuDetail[],
  kantsuCount: number,
  isTsumo: boolean,
  jikaze: Kazehai,
): ApplyRiichiResult {
  const isMenzenHand = tehai.exposed.length === 0;
  if (!isMenzenHand || Math.random() < 0.3) {
    return { answer: currentAnswer, uraDoraMarkers: undefined, additionalYakuDetails: [] };
  }

  const additionalYakuDetails: YakuDetail[] = [];
  const isDoubleRiichi = Math.random() < 0.1;
  let riichiHan = 1;
  let riichiName = "立直";

  if (isDoubleRiichi) {
    riichiHan = 2;
    riichiName = "ダブル立直";
  }

  additionalYakuDetails.push({ name: riichiName, han: riichiHan });

  const uraDoraMarkers: HaiKindId[] = [];
  let extraHan = riichiHan;

  for (let i = 0; i < kantsuCount + 1; i++) {
    const marker = Math.floor(Math.random() * 34);
    if (isHaiKindId(marker)) {
      uraDoraMarkers.push(marker);
    }
  }

  const hasUraDora = Math.random() < 0.4;
  if (hasUraDora) {
    const uraHan = Math.floor(Math.random() * 2) + 1;
    additionalYakuDetails.push({ name: "裏ドラ", han: uraHan });
    extraHan += uraHan;
  }

  const newHan = currentAnswer.han + extraHan;
  const answer = recalculateScore(currentAnswer, newHan, {
    isTsumo,
    isOya: jikaze === HaiKind.Ton,
  });

  return { answer, uraDoraMarkers, additionalYakuDetails };
}

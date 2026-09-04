import {
  HaiKind,
  type HaiKindId,
  type Tehai14,
  type Kazehai,
  type RuleConfig,
  type ScoreResult,
} from "@pai-forge/riichi-mahjong";
import type { YakuDetail } from "../types";
import { recalculateScore } from "../../../score/calculator";
import { countDoraInTehai } from "../../../core/dora";
import { countHaiInTehai } from "../../../core/hai-count";
import { getKeyForKazehai, isOya } from "../../../core/kaze";
import { getYakuNameJa } from "../../../core/yaku-names";

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
 *
 * 翻が増えた分の点数はライブラリに再計算させる。切り上げ満貫のように
 * 点数区分に効くルール設定は `ruleConfig` で渡し、元の点数計算と同じ
 * 設定で再計算する。
 */
export function reconcileYakuhai(input: {
  readonly tehai: Tehai14;
  readonly yakuResult: readonly (readonly [string, number])[];
  readonly answer: ScoreResult;
  readonly bakaze: Kazehai;
  readonly jikaze: Kazehai;
  readonly isTsumo: boolean;
  readonly ruleConfig?: RuleConfig;
}): ReconcileYakuhaiResult {
  const { tehai, yakuResult, answer, bakaze, jikaze, isTsumo, ruleConfig } =
    input;
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

  // 三元牌チェック。表示名は英語キーから getYakuNameJa で導出する
  const dragons: readonly { readonly id: HaiKindId; readonly key: string }[] = [
    { id: HaiKind.Haku, key: "Haku" },
    { id: HaiKind.Hatsu, key: "Hatsu" },
    { id: HaiKind.Chun, key: "Chun" },
  ];

  for (const { id, key } of dragons) {
    const hasDragon = yakuResult.some((y) => y[0] === key);
    if (!hasDragon && countHaiInTehai(tehai, id) >= 3) {
      extraYakuhaiHan += 1;
      additionalYakuDetails.push({ name: getYakuNameJa(key), han: 1 });
    }
  }

  if (extraYakuhaiHan > 0) {
    const newHan = answer.han + extraYakuhaiHan;
    const newAnswer = recalculateScore(answer, newHan, {
      isTsumo,
      isOya: isOya(jikaze),
      ruleConfig,
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
  /** 点数区分に効くルール設定（切り上げ満貫）。元の点数計算と同じものを渡す */
  readonly ruleConfig?: RuleConfig;
}): ApplyRiichiResult {
  const {
    tehai,
    currentAnswer,
    uraDoraMarkers,
    isDoubleRiichi,
    isTsumo,
    jikaze,
    ruleConfig,
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
    ruleConfig,
  });

  return { answer, additionalYakuDetails };
}

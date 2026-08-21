import {
  HaiKind,
  calculateScoreForTehai,
  type Kazehai,
  type ScoreResult,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import { KAZEHAI } from "../../core/constants";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";
import { randomBool, randomChoice } from "../../core/random";
import { convertScoreDetailToFuDetails } from "../../score/fu-calculator";
import { generateChiitoiTehai } from "../score/strategies/chiitoi-strategy";
import { generateMentsuTehai } from "../score/strategies/mentsu-strategy";
import type { AgariContext } from "../shared/agari-context";
import type { TotalFuQuestion } from "./types";

/** 七対子を出題する確率 */
const CHIITOI_RATE = 0.12;

/** 場風の候補（東場・南場） */
const BAKAZE_OPTIONS: readonly Kazehai[] = [HaiKind.Ton, HaiKind.Nan];

/**
 * 符計算のみを目的とした点数計算
 * 符目的の点数計算
 *
 * `calculateScoreForTehai` は例外を投げうるため、ライブラリ境界である
 * この関数内でのみ try/catch で防御し undefined に変換する。
 * ドラは符に影響しないため表示・計算とも扱わない（空配列を渡す）。
 */
function calculateFuSource(
  tehai: Tehai14,
  context: AgariContext,
  renfonpaiAs4Fu: boolean,
): ScoreResult | undefined {
  try {
    return calculateScoreForTehai(tehai, {
      agariHai: context.agariHai,
      isTsumo: context.isTsumo,
      jikaze: context.jikaze,
      bakaze: context.bakaze,
      doraMarkers: [],
      ruleConfig: { doubleWindJantouFu: renfonpaiAs4Fu ? 4 : 2 },
    });
  } catch {
    return undefined;
  }
}

/**
 * 手牌全体の合計符を答える問題を生成する（生成不可能な場合は undefined を返す）
 * 合計符問題ジェネレータ
 *
 * 平和ツモ（20符）・食い平和（30符）・七対子（25符）といった特例は
 * ライブラリの符計算がそのまま扱うため、ここでは分岐を持たない。
 *
 * @param options.renfonpaiAs4Fu - 連風牌の雀頭を4符として扱うか（既定 false=2符）
 * @param options.idGen - 問題 ID の採番（既定 crypto.randomUUID）
 */
export function generateTotalFuQuestion(
  options: {
    readonly renfonpaiAs4Fu?: boolean;
    readonly idGen?: IdGenerator;
  } = {},
): TotalFuQuestion | undefined {
  const { renfonpaiAs4Fu = false, idGen = defaultIdGenerator } = options;

  // 1. 手牌の生成（七対子 or 面子手）
  const tehaiResult = randomBool(CHIITOI_RATE)
    ? generateChiitoiTehai()
    : generateMentsuTehai(true);
  if (!tehaiResult) return undefined;

  // 2. 和了状況の決定
  const context: AgariContext = {
    agariHai: tehaiResult.agariHai,
    isTsumo: randomBool(0.5),
    bakaze: randomChoice(BAKAZE_OPTIONS),
    jikaze: randomChoice(KAZEHAI),
  };

  // 3. 符の算出（ライブラリ境界）
  const score = calculateFuSource(tehaiResult.tehai, context, renfonpaiAs4Fu);
  if (!score?.detail) return undefined;

  // 役が無い手はそもそも和了できず、出題として成立しない。
  // 平和ツモの20符もライブラリ側の役判定に依存するため、ここで弾いておく。
  if (score.han === 0) return undefined;

  return {
    id: idGen(),
    tehai: tehaiResult.tehai,
    context,
    // 内訳と食い違わないよう、答えもライブラリが選択した構造の符から取る
    answer: score.detail.fuResult.total,
    fuDetails: convertScoreDetailToFuDetails(score.detail, context),
  };
}

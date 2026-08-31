import {
  calculateScoreForTehai,
  type Kazehai,
  type ScoreResult,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import { BAKAZE_OPTIONS, KAZEHAI } from "../../core/constants";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";
import {
  randomBool,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import { convertScoreDetailToFuDetails } from "../../score/fu-calculator";
import { generateChiitoiTehai } from "../score/strategies/chiitoi-strategy";
import { generateMentsuTehai } from "../score/strategies/mentsu-strategy";
import type { AgariContext } from "../shared/agari-context";
import type { TotalFuQuestion } from "./types";
import { doubleWindJantouFu } from "../../rules/settings";

/** 七対子を出題する確率 */
const CHIITOI_RATE = 0.12;

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
      ruleConfig: {
        doubleWindJantouFu: doubleWindJantouFu(renfonpaiAs4Fu),
      },
    });
  } catch {
    return undefined;
  }
}

/**
 * 出題しうる自風を返す
 * 自風候補
 *
 * `excludeRenfonpai` が立つと場風と同じ風を落とし、連風牌（場風＝自風）が
 * 成立しない局面だけを出題する。連風牌の雀頭を2符とするか4符とするかは
 * ローカルルールで割れており（{@link doubleWindJantouFu}）、その1点だけで
 * 手牌の合計符が変わってしまうため、答えを1つに定めたい出題
 * （端末ごとのルール設定に左右されてはならない昇級試験）が使う。
 *
 * 雀頭が連風牌の手だけを弾く形にはしない。ライブラリは符が最大になる面子
 * 構成を選ぶため、「選ばれた構成の雀頭は連風牌でないが、別の解釈では
 * 連風牌の雀頭が立ち、4符ルールではそちらが選ばれる」手が残りうる。
 * 場風＝自風の局面ごと出題しなければ、どの解釈をとっても連風牌は現れない。
 */
function jikazeOptions(
  bakaze: Kazehai,
  excludeRenfonpai: boolean,
): readonly Kazehai[] {
  return excludeRenfonpai ? KAZEHAI.filter((kaze) => kaze !== bakaze) : KAZEHAI;
}

/**
 * 手牌全体の合計符を答える問題を生成する（生成不可能な場合は undefined を返す）
 * 合計符問題ジェネレータ
 *
 * 平和ツモ（20符）・食い平和（30符）・七対子（25符）といった特例は
 * ライブラリの符計算がそのまま扱うため、ここでは分岐を持たない。
 *
 * @param options.renfonpaiAs4Fu - 連風牌の雀頭を4符として扱うか（既定 false=2符）
 * @param options.excludeRenfonpai - 場風＝自風の局面を出題しないか（既定 false）
 * @param options.idGen - 問題 ID の採番（既定 crypto.randomUUID）
 * @param options.rng - 乱数供給源（既定 Math.random）
 */
export function generateTotalFuQuestion(
  options: {
    readonly renfonpaiAs4Fu?: boolean;
    readonly excludeRenfonpai?: boolean;
    readonly idGen?: IdGenerator;
    readonly rng?: RandomSource;
  } = {},
): TotalFuQuestion | undefined {
  const {
    renfonpaiAs4Fu = false,
    excludeRenfonpai = false,
    idGen = defaultIdGenerator,
    rng = defaultRandomSource,
  } = options;

  // 1. 手牌の生成（七対子 or 面子手）
  const tehaiResult = randomBool(CHIITOI_RATE, rng)
    ? generateChiitoiTehai(rng)
    : generateMentsuTehai(true, rng);
  if (!tehaiResult) return undefined;

  // 2. 和了状況の決定
  const bakaze = randomChoice(BAKAZE_OPTIONS, rng);
  const context: AgariContext = {
    agariHai: tehaiResult.agariHai,
    isTsumo: randomBool(0.5, rng),
    bakaze,
    jikaze: randomChoice(jikazeOptions(bakaze, excludeRenfonpai), rng),
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

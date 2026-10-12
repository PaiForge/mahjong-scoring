import {
  calculateScoreForTehai,
  type Fu,
  type Kazehai,
  type RuleConfig,
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
import { isFu } from "../../score/constants";
import { convertScoreDetailToFuDetails } from "../../score/fu-calculator";
import { generateChiitoiTehai } from "../score/strategies/chiitoi-strategy";
import { generateMentsuTehai } from "../score/strategies/mentsu-strategy";
import type { AgariContext } from "../shared/agari-context";
import type { TotalFuQuestion } from "./types";
import { doubleWindJantouFu } from "../../rules/settings";
import { retryGenerate } from "../retry-generate";
import { pickTotalFuBand, type TotalFuBand, type TotalFuRange } from "./range";

/** 七対子を出題する確率 */
const CHIITOI_RATE = 0.12;

/**
 * 符計算のみを目的とした点数計算
 * 符目的の点数計算
 *
 * 役が無い手（形式和了）は `calculateScoreForTehai` が Err で返す。
 * 和了できない手は出題にならないため undefined に変換する。
 * ドラは符に影響しないため表示・計算とも扱わない（空配列を渡す）。
 */
function calculateFuSource(
  tehai: Tehai14,
  context: AgariContext,
  ruleConfig: RuleConfig,
): ScoreResult | undefined {
  const result = calculateScoreForTehai(tehai, {
    agariHai: context.agariHai,
    isTsumo: context.isTsumo,
    jikaze: context.jikaze,
    bakaze: context.bakaze,
    doraMarkers: [],
    ruleConfig,
  });
  return result.isErr() ? undefined : result.value;
}

/** 符の練習が採点に使うルール設定（符に効くのは連風牌の雀頭符だけ） */
function fuRuleConfig(renfonpaiAs4Fu: boolean): RuleConfig {
  return { doubleWindJantouFu: doubleWindJantouFu(renfonpaiAs4Fu) };
}

/**
 * 手牌と和了状況から、手牌全体の符を求める
 * 合計符計算
 *
 * 合計符の練習と同じ計算（ライブラリが選んだ符が最大になる面子構成の符。
 * 10 符単位に切り上げ済みで、七対子・平和ツモの特例も含む）。役が無い手は
 * 和了できないので undefined。
 *
 * @param tehai 和了形の手牌
 * @param context 和了状況
 * @param renfonpaiAs4Fu 連風牌の雀頭を4符として扱うか（既定 false=2符）
 */
export function calculateTotalFu(
  tehai: Tehai14,
  context: AgariContext,
  renfonpaiAs4Fu = false,
): Fu | undefined {
  const score = calculateFuSource(tehai, context, fuRuleConfig(renfonpaiAs4Fu));
  if (!score?.detail || score.han === 0) return undefined;
  return score.detail.fuResult.total;
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

/** {@link generateTotalFuQuestion} の出題条件（各項目の意味はそちらの `@param`） */
export interface TotalFuGeneratorOptions {
  readonly renfonpaiAs4Fu?: boolean;
  readonly excludeRenfonpai?: boolean;
  readonly fuBand?: TotalFuBand;
  readonly idGen?: IdGenerator;
  readonly rng?: RandomSource;
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
 * @param options.fuBand - 正解の符をこの帯に限る（帯の外なら undefined。既定は限らない）
 * @param options.idGen - 問題 ID の採番（既定 crypto.randomUUID）
 * @param options.rng - 乱数供給源（既定 Math.random）
 */
export function generateTotalFuQuestion(
  options: TotalFuGeneratorOptions = {},
): TotalFuQuestion | undefined {
  const {
    renfonpaiAs4Fu = false,
    excludeRenfonpai = false,
    fuBand,
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
  const ruleConfig = fuRuleConfig(renfonpaiAs4Fu);
  const context: TotalFuQuestion["context"] = {
    agariHai: tehaiResult.agariHai,
    isTsumo: randomBool(0.5, rng),
    bakaze,
    jikaze: randomChoice(jikazeOptions(bakaze, excludeRenfonpai), rng),
    ruleConfig,
  };

  // 3. 符の算出（ライブラリ境界）
  const score = calculateFuSource(tehaiResult.tehai, context, ruleConfig);
  if (!score?.detail) return undefined;

  // 役が無い手はそもそも和了できず、出題として成立しない。
  // 平和ツモの20符もライブラリ側の役判定に依存するため、ここで弾いておく。
  if (score.han === 0) return undefined;

  // 回答の選択肢（FU_VALUES）に無い符は出題しない。么九牌の暗槓を複数含む手は
  // 110符を超えることがあり（ライブラリの `Fu` は170符まで）、選択肢から
  // 選べない問題になるため
  if (!isFu(score.detail.fuResult.total)) return undefined;

  const total = score.detail.fuResult.total;
  if (fuBand && (total < fuBand.min || total > fuBand.max)) return undefined;

  return {
    id: idGen(),
    tehai: tehaiResult.tehai,
    context,
    // 内訳と食い違わないよう、答えもライブラリが選択した構造の符から取る
    answer: score.detail.fuResult.total,
    fuDetails: convertScoreDetailToFuDetails(score.detail, context),
  };
}

/**
 * 出題範囲つきの合計符の生成リトライ予算
 * 範囲つき出題リトライ予算
 *
 * 1 回の試行が成立するのは約 47%（牌の残数不足・役なしの手を弾くため）で、
 * そのうち正解が 50・60符になるのは約 16%。50・60符の帯を引いた問題は
 * 1 試行あたり約 7.5% しか成立せず、範囲なしの練習と同じ 100 回では
 * 約 0.04%/問で生成に失敗する（盤面がプレースホルダのまま固まり、
 * チャレンジのタイマーだけが進む）。500 回なら失敗確率は 1e-17 程度で
 * 実質ゼロになり、平均の試行回数は 15 回前後にとどまる。
 */
export const TOTAL_FU_RANGE_MAX_ATTEMPTS = 500;

/**
 * 出題範囲（{@link TotalFuRange}）に収まる合計符の問題を生成する（生成できなければ undefined）
 * 範囲つき合計符問題ジェネレータ
 *
 * 正解の符の帯を 1 問につき 1 回だけ選び、その帯に収まる手が出るまで
 * {@link generateTotalFuQuestion} を試す（帯を固定する理由は
 * {@link pickTotalFuBand}）。
 *
 * @param range - 出題範囲
 * @param options - {@link generateTotalFuQuestion} の条件（帯は範囲から決める）
 */
export function generateTotalFuQuestionInRange(
  range: TotalFuRange,
  options: Omit<TotalFuGeneratorOptions, "fuBand"> = {},
): TotalFuQuestion | undefined {
  const fuBand = pickTotalFuBand(range, options.rng ?? defaultRandomSource);
  return retryGenerate(
    () => generateTotalFuQuestion({ ...options, fuBand }),
    TOTAL_FU_RANGE_MAX_ATTEMPTS,
  );
}

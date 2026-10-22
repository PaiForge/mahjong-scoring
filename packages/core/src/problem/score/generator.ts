import {
  detectYaku,
  getYakumanMultiplier,
  isMenzen,
  type HaiKindId,
  type RuleConfig,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import {
  randomBool,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";

import type {
  ScoreQuestion,
  ScoreRange,
  QuestionGeneratorOptions,
} from "./types";
import { generateMentsuTehai } from "./strategies/mentsu-strategy";
import { generateChiitoiTehai } from "./strategies/chiitoi-strategy";
import { generateDoraMarkers } from "../shared/dora-utils";
import { selectBakaze, selectJikaze } from "../shared/kaze-select";
import { retryGenerate } from "../retry-generate";
import {
  ALL_YAKUMAN_RULES_ENABLED,
  doubleWindJantouFu,
} from "../../rules/settings";
import { isKiriageManganTarget } from "../../score/calculator";
import { isFu } from "../../score/constants";
import { SCORE_YAKU_NAME_MAP } from "../../core/yaku-names";
import {
  buildScoreQuestion,
  isScoreLevelAllowed,
  type RiichiInput,
} from "./build-question";

/** 七対子の日本語表示名（`requiredYaku` / `yakuDetails.name` の語彙） */
const CHIITOITSU = SCORE_YAKU_NAME_MAP.Chiitoitsu;

/**
 * 既定値を埋めた出題条件
 * 出題条件（解決済み）
 *
 * 各項目の意味と既定値の根拠は {@link QuestionGeneratorOptions}。
 */
export interface ResolvedScoreGeneratorOptions {
  readonly includeFuro: boolean;
  readonly requireFuro: boolean;
  readonly includeChiitoi: boolean;
  readonly includeParent: boolean;
  readonly includeChild: boolean;
  readonly renfonpaiAs4Fu: boolean;
  readonly excludeRenfonpai: boolean;
  readonly kiriageMangan: boolean;
  readonly excludeKiriageBoundary: boolean;
  readonly yakumanRules: QuestionGeneratorOptions["yakumanRules"];
  readonly excludeYakumanRuleBoundary: boolean;
  readonly allowedRanges: readonly ScoreRange[];
  readonly minHan: number;
  readonly requiredYaku: readonly string[] | undefined;
  readonly allowedFu: readonly number[] | undefined;
  readonly rng: RandomSource;
}

/**
 * 出題条件の既定値を埋める
 * 出題条件解決
 */
export function resolveScoreGeneratorOptions(
  options: QuestionGeneratorOptions,
): ResolvedScoreGeneratorOptions {
  return {
    includeFuro: options.includeFuro ?? true,
    requireFuro: options.requireFuro ?? false,
    includeChiitoi: options.includeChiitoi ?? false,
    includeParent: options.includeParent ?? true,
    includeChild: options.includeChild ?? true,
    renfonpaiAs4Fu: options.renfonpaiAs4Fu ?? false,
    excludeRenfonpai: options.excludeRenfonpai ?? false,
    kiriageMangan: options.kiriageMangan ?? false,
    excludeKiriageBoundary: options.excludeKiriageBoundary ?? false,
    yakumanRules: options.yakumanRules,
    excludeYakumanRuleBoundary: options.excludeYakumanRuleBoundary ?? false,
    allowedRanges: options.allowedRanges ?? ["nonMangan", "manganPlus"],
    minHan: options.minHan ?? 0,
    requiredYaku: options.requiredYaku,
    allowedFu: options.allowedFu,
    rng: options.rng ?? defaultRandomSource,
  };
}

/**
 * 採点に渡すルール設定
 *
 * 切り上げ満貫を含むルール設定はライブラリに渡し、点数区分・支払いの導出を
 * すべてライブラリ側で行う。後付けの翻で再計算する経路（リーチ・内訳合わせ）
 * にも同じ設定を渡すこと。
 */
function ruleConfigOf(options: ResolvedScoreGeneratorOptions): RuleConfig {
  return {
    doubleWindJantouFu: doubleWindJantouFu(options.renfonpaiAs4Fu),
    kiriageMangan: options.kiriageMangan,
    ...options.yakumanRules,
  };
}

/** 生成した和了形と和了牌 */
interface DrawnTehai {
  readonly tehai: Tehai14;
  readonly agariHai: HaiKindId;
}

/**
 * 1. 手牌の生成（七対子 or 面子手）
 * 和了形抽選
 *
 * 七対子は既定では出さない（includeChiitoi）。ただし requiredYaku で
 * 名指しされた場合は面子手をいくら作っても条件を満たせないため、
 * フラグに関係なく生成対象に含める。七対子しか要求されていないなら
 * 毎回七対子を作る（10%抽選のままだと9割を捨てることになる）。
 */
function drawTehai(
  options: ResolvedScoreGeneratorOptions,
): DrawnTehai | undefined {
  const { includeFuro, requireFuro, includeChiitoi, requiredYaku, rng } =
    options;
  const chiitoiRequested = requiredYaku?.includes(CHIITOITSU) ?? false;
  const chiitoiOnly = chiitoiRequested && requiredYaku?.length === 1;
  const isChiitoi =
    chiitoiOnly ||
    ((includeChiitoi || chiitoiRequested) && randomBool(0.1, rng));
  const tehaiResult = isChiitoi
    ? generateChiitoiTehai(rng)
    : generateMentsuTehai(includeFuro, rng);
  if (!tehaiResult) return undefined;
  // 副露縛りは手を作った直後に判定する（点数計算まで進めてから捨てない）
  if (requireFuro && isMenzen(tehaiResult.tehai)) return undefined;
  return { tehai: tehaiResult.tehai, agariHai: tehaiResult.agariHai };
}

/** 和了形に決めた局面（ツモ・風・ドラ・リーチ） */
interface ScoreScene extends DrawnTehai {
  readonly isTsumo: boolean;
  readonly jikaze: ScoreQuestion["jikaze"];
  readonly bakaze: ScoreQuestion["bakaze"];
  readonly doraMarkers: readonly HaiKindId[];
  readonly riichi: RiichiInput | undefined;
}

/**
 * 2. 和了状況の決定
 * 局面抽選
 *
 * リーチの抽選はここが唯一の判定（門前のみ、確率20%）。isRiichi が true の
 * 問題は必ず裏ドラ表示牌と立直の翻を持つ（出題表示と正解が食い違わない）。
 */
function drawScene(
  drawn: DrawnTehai,
  options: ResolvedScoreGeneratorOptions,
): ScoreScene | undefined {
  const { includeParent, includeChild, excludeRenfonpai, rng } = options;
  const isTsumo = randomBool(0.5, rng);
  const jikaze = selectJikaze(includeParent, includeChild, rng);
  const bakaze = selectBakaze(jikaze, excludeRenfonpai, rng);
  const isRiichi = isMenzen(drawn.tehai) && randomBool(0.2, rng);
  const markers = generateDoraMarkers(drawn.tehai, isRiichi, rng);
  if (!markers) return undefined;
  const { doraMarkers, uraDoraMarkers } = markers;
  const riichi: RiichiInput | undefined =
    isRiichi && uraDoraMarkers ? { uraDoraMarkers } : undefined;
  return { ...drawn, isTsumo, jikaze, bakaze, doraMarkers, riichi };
}

/**
 * ルール設定の採否で正解が割れる手か
 * ルール境界判定
 *
 * 4. 役満ルール: 役満役を含む手に限り、全ルール有効として数え直したときに
 *    役満2個分以上になるか（= 全ルール無効時と点数が割れるか）で判定する。
 *    判定理由と同値性は QuestionGeneratorOptions の
 *    excludeYakumanRuleBoundary の TSDoc を参照
 * 5. 切り上げ満貫: 30符4翻・60符3翻。判定は翻数と符だけで行うため、
 *    切り上げ満貫を有効にして計算した結果（区分が既に満貫）でも境界の手を落とせる
 */
export function crossesRuleBoundary(
  question: ScoreQuestion,
  options: Pick<
    ResolvedScoreGeneratorOptions,
    "excludeYakumanRuleBoundary" | "excludeKiriageBoundary"
  >,
): boolean {
  const { answer } = question;
  if (options.excludeYakumanRuleBoundary && answer.yakumanMultiplier >= 1) {
    const allOnResult = detectYaku(question.tehai, {
      agariHai: question.agariHai,
      bakaze: question.bakaze,
      jikaze: question.jikaze,
      doraMarkers: question.doraMarkers,
      isTsumo: question.isTsumo,
      ruleConfig: ALL_YAKUMAN_RULES_ENABLED,
    });
    if (getYakumanMultiplier(allOnResult, ALL_YAKUMAN_RULES_ENABLED) >= 2)
      return true;
  }
  return options.excludeKiriageBoundary && isKiriageManganTarget(answer);
}

/**
 * 6. 点数帯・最小翻数・符・役の出題条件を満たすか
 * 出題条件判定
 *
 * - minHan はリーチ・裏ドラ適用後の最終翻数で判定する（出題表示と一致させる）
 * - 回答の符選択肢（FU_VALUES）に無い符は出題しない。么九牌の暗槓を複数
 *   含む手は 110符を超えることがあり（ライブラリの `Fu` は170符まで）、
 *   選択肢から選べない問題になるため
 * - 役の絞り込みも最終形の yakuDetails（役牌の照合・リーチ・ドラ適用後）で
 *   判定する。複数指定は OR（いずれか1つでも成立していれば出題）
 */
export function matchesScoreFilters(
  question: ScoreQuestion,
  options: Pick<
    ResolvedScoreGeneratorOptions,
    "allowedRanges" | "minHan" | "allowedFu" | "requiredYaku"
  >,
): boolean {
  const { answer, yakuDetails } = question;
  const { allowedRanges, minHan, allowedFu, requiredYaku } = options;
  if (!isScoreLevelAllowed(answer.scoreLevel, allowedRanges)) return false;
  if (answer.han < minHan) return false;
  if (!isFu(answer.fu)) return false;
  if (allowedFu !== undefined && !allowedFu.includes(answer.fu)) return false;
  return (
    requiredYaku === undefined ||
    requiredYaku.length === 0 ||
    yakuDetails.some((yaku) => requiredYaku.includes(yaku.name))
  );
}

/**
 * 点数計算練習の問題を1つ生成する（生成不可能な場合は undefined を返す）
 * 点数計算練習問題生成
 *
 * 手牌の抽選 → 局面の抽選 → 点数・役の計算（ライブラリ境界）→ ルール境界の
 * 除外 → 出題条件の判定、の順。途中で条件を満たさなくなったらその場で捨てる。
 */
export function generateScoreQuestion(
  options: QuestionGeneratorOptions = {},
): ScoreQuestion | undefined {
  const resolved = resolveScoreGeneratorOptions(options);

  const drawn = drawTehai(resolved);
  if (!drawn) return undefined;
  const scene = drawScene(drawn, resolved);
  if (!scene) return undefined;

  // 役なし（形式和了）とトリプル役満以上はどちらも出題にならない
  const built = buildScoreQuestion({
    ...scene,
    ruleConfig: ruleConfigOf(resolved),
  });
  if (built.isErr()) return undefined;
  const question = built.value;

  if (crossesRuleBoundary(question, resolved)) return undefined;
  if (!matchesScoreFilters(question, resolved)) return undefined;
  return question;
}

/**
 * 有効な問題が生成されるまでリトライするヘルパー
 * 有効問題生成
 *
 * @param options - 問題生成オプション
 * @param maxRetries - 最大リトライ回数
 */
export function generateValidScoreQuestion(
  options: QuestionGeneratorOptions = {},
  maxRetries: number = 100,
): ScoreQuestion | undefined {
  return retryGenerate(() => generateScoreQuestion(options), maxRetries);
}

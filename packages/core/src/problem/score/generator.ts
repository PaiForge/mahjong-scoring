import {
  detectYaku,
  getYakumanMultiplier,
  isMenzen,
  type RuleConfig,
} from "@pai-forge/riichi-mahjong";
import { randomBool, defaultRandomSource } from "../../core/random";

import type { ScoreQuestion, QuestionGeneratorOptions } from "./types";
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
 * 点数計算練習の問題を1つ生成する（生成不可能な場合は undefined を返す）
 * 点数計算練習問題生成
 */
export function generateScoreQuestion(
  options: QuestionGeneratorOptions = {},
): ScoreQuestion | undefined {
  const {
    includeFuro = true,
    requireFuro = false,
    includeChiitoi = false,
    includeParent = true,
    includeChild = true,
    renfonpaiAs4Fu = false,
    excludeRenfonpai = false,
    kiriageMangan = false,
    excludeKiriageBoundary = false,
    yakumanRules,
    excludeYakumanRuleBoundary = false,
    allowedRanges = ["nonMangan", "manganPlus"],
    minHan = 0,
    requiredYaku,
    allowedFu,
    rng = defaultRandomSource,
  } = options;

  // 1. 手牌の生成（七対子 or 面子手）
  //    七対子は既定では出さない（includeChiitoi）。ただし requiredYaku で
  //    名指しされた場合は面子手をいくら作っても条件を満たせないため、
  //    フラグに関係なく生成対象に含める。七対子しか要求されていないなら
  //    毎回七対子を作る（10%抽選のままだと9割を捨てることになる）。
  const chiitoiRequested = requiredYaku?.includes(CHIITOITSU) ?? false;
  const chiitoiOnly = chiitoiRequested && requiredYaku?.length === 1;
  const isChiitoi =
    chiitoiOnly ||
    ((includeChiitoi || chiitoiRequested) && randomBool(0.1, rng));
  const tehaiResult = isChiitoi
    ? generateChiitoiTehai(rng)
    : generateMentsuTehai(includeFuro, rng);
  if (!tehaiResult) return undefined;
  const { tehai, agariHai } = tehaiResult;
  //    副露縛りは手を作った直後に判定する（点数計算まで進めてから捨てない）
  if (requireFuro && isMenzen(tehai)) return undefined;

  // 2. 和了状況の決定
  //    リーチの抽選はここが唯一の判定（門前のみ、確率20%）。isRiichi が true の
  //    問題は必ず裏ドラ表示牌と立直の翻を持つ（出題表示と正解が食い違わない）
  const isTsumo = randomBool(0.5, rng);
  const jikaze = selectJikaze(includeParent, includeChild, rng);
  const bakaze = selectBakaze(jikaze, excludeRenfonpai, rng);
  const isRiichi = isMenzen(tehai) && randomBool(0.2, rng);
  const markers = generateDoraMarkers(tehai, isRiichi, rng);
  if (!markers) return undefined;
  const { doraMarkers, uraDoraMarkers } = markers;
  const riichi: RiichiInput | undefined =
    isRiichi && uraDoraMarkers
      ? { isDouble: randomBool(0.1, rng), uraDoraMarkers }
      : undefined;

  // 3. 点数・役の計算（ライブラリ境界）
  //    切り上げ満貫を含むルール設定はライブラリに渡し、点数区分・支払いの
  //    導出をすべてライブラリ側で行う。後付けの翻で再計算する経路
  //    （リーチ・内訳合わせ）にも同じ設定を渡すこと
  const ruleConfig: RuleConfig = {
    doubleWindJantouFu: doubleWindJantouFu(renfonpaiAs4Fu),
    kiriageMangan,
    ...yakumanRules,
  };
  const built = buildScoreQuestion({
    tehai,
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    ruleConfig,
    riichi,
  });
  //    役なし（形式和了）とトリプル役満以上はどちらも出題にならない
  if (built.isErr()) return undefined;
  const question = built.value;
  const finalAnswer = question.answer;
  const yakuDetails = question.yakuDetails ?? [];

  // 4. 役満ルールの採否で正解が割れる手の除外
  //     役満役を含む手に限り、全ルール有効として数え直したときに役満2個分
  //     以上になるか（= 全ルール無効時と点数が割れるか）で判定する。
  //     判定理由と同値性は QuestionGeneratorOptions の
  //     excludeYakumanRuleBoundary の TSDoc を参照
  if (excludeYakumanRuleBoundary && finalAnswer.yakumanMultiplier >= 1) {
    const allOnResult = detectYaku(tehai, {
      agariHai,
      bakaze,
      jikaze,
      doraMarkers,
      isTsumo,
      ruleConfig: ALL_YAKUMAN_RULES_ENABLED,
    });
    if (getYakumanMultiplier(allOnResult, ALL_YAKUMAN_RULES_ENABLED) >= 2)
      return undefined;
  }

  // 5. 切り上げ満貫で点数が割れる手（30符4翻・60符3翻）の除外
  //    判定は翻数と符だけで行うため、切り上げ満貫を有効にして計算した
  //    結果（区分が既に満貫）でも境界の手を落とせる
  if (excludeKiriageBoundary && isKiriageManganTarget(finalAnswer))
    return undefined;

  // 6. 点数帯・最小翻数・符・役の検証
  //    minHan はリーチ・裏ドラ適用後の最終翻数で判定する（出題表示と一致させる）
  if (!isScoreLevelAllowed(finalAnswer.scoreLevel, allowedRanges))
    return undefined;
  if (finalAnswer.han < minHan) return undefined;
  //    回答の符選択肢（FU_VALUES）に無い符は出題しない。么九牌の暗槓を複数
  //    含む手は 110符を超えることがあり（ライブラリの `Fu` は170符まで）、
  //    選択肢から選べない問題になるため
  if (!isFu(finalAnswer.fu)) return undefined;
  if (allowedFu !== undefined && !allowedFu.includes(finalAnswer.fu))
    return undefined;
  //    役の絞り込みも最終形の yakuDetails（役牌の照合・リーチ・ドラ適用後）で
  //    判定する。複数指定は OR（いずれか1つでも成立していれば出題）
  if (
    requiredYaku !== undefined &&
    requiredYaku.length > 0 &&
    !yakuDetails.some((yaku) => requiredYaku.includes(yaku.name))
  )
    return undefined;

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

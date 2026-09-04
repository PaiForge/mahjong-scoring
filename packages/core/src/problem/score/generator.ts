import {
  HaiKind,
  calculateScoreForTehai,
  detectYaku,
  getYakumanMultiplier,
  isMenzen,
  type HaiKindId,
  type Kazehai,
  type RuleConfig,
  type ScoreResult,
  type Tehai14,
  type YakuResult,
} from "@pai-forge/riichi-mahjong";
import { BAKAZE_OPTIONS, ScoreLevel, KAZEHAI } from "../../core/constants";
import {
  randomBool,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";

import type {
  ScoreQuestion,
  QuestionGeneratorOptions,
  ScoreRange,
  YakuDetail,
} from "./types";
import { applyRiichiAndUraDora } from "./utils/reconciler";
import { generateMentsuTehai } from "./strategies/mentsu-strategy";
import { generateChiitoiTehai } from "./strategies/chiitoi-strategy";
import { generateDoraMarkers } from "../shared/dora-utils";
import {
  assembleScoreQuestion,
  buildYakuDetailsFromResult,
} from "./assemble-question";
import { retryGenerate } from "../retry-generate";
import type { AgariContext } from "../shared/agari-context";
import {
  ALL_YAKUMAN_RULES_ENABLED,
  doubleWindJantouFu,
} from "../../rules/settings";
import {
  isKiriageManganTarget,
  recalculateScore,
} from "../../score/calculator";
import { countDoraInTehai } from "../../core/dora";
import { isOya } from "../../core/kaze";
import { isFu } from "../../score/constants";
import { SCORE_YAKU_NAME_MAP } from "../../core/yaku-names";

/** 七対子の日本語表示名（`requiredYaku` / `yakuDetails.name` の語彙） */
const CHIITOITSU = SCORE_YAKU_NAME_MAP.Chiitoitsu;

/**
 * 点数レベルが許可範囲内かどうかを検証する
 * 点数範囲検証
 */
function validateScoreRange(
  scoreLevel: string,
  allowedRanges: readonly ScoreRange[],
): boolean {
  if (
    allowedRanges.length === 1 &&
    allowedRanges[0] === "nonMangan" &&
    scoreLevel !== ScoreLevel.Normal
  )
    return false;
  if (
    allowedRanges.length === 1 &&
    allowedRanges[0] === "manganPlus" &&
    scoreLevel === ScoreLevel.Normal
  )
    return false;
  return true;
}

/**
 * 出題する自風を選択する
 * 自風選択
 */
function selectJikaze(
  includeParent: boolean,
  includeChild: boolean,
  rng: RandomSource,
): Kazehai {
  let candidates: readonly Kazehai[] = KAZEHAI;
  if (!includeParent) candidates = candidates.filter((k) => k !== HaiKind.Ton);
  if (!includeChild) candidates = candidates.filter((k) => k === HaiKind.Ton);
  if (candidates.length === 0) candidates = KAZEHAI;
  return randomChoice(candidates, rng);
}

/**
 * 出題する場風を選択する
 * 場風選択
 *
 * `excludeRenfonpai` が立つと自風と同じ風を落とし、連風牌（場風＝自風）が
 * 成立しない局面だけを出題する（理由は `QuestionGeneratorOptions` の
 * `excludeRenfonpai` に書いてある）。
 *
 * 合計符の出題（`generateTotalFuQuestion`）は逆に場風を先に決めて自風を
 * 落とすが、点数の出題では向きを変えている。あちらの向きだと自風が場風以外の
 * 3択になり、親（東）が出るのは南場のときだけ — 全体の 1/6 にまで下がる。
 * 点数は親と子で別の表を引くため、親の出題が細るのは出題として困る。
 * 場風は東南の2択しかなく、片方を落としても必ず候補が残る。
 */
function selectBakaze(
  jikaze: Kazehai,
  excludeRenfonpai: boolean,
  rng: RandomSource,
): Kazehai {
  const candidates = excludeRenfonpai
    ? BAKAZE_OPTIONS.filter((kaze) => kaze !== jikaze)
    : BAKAZE_OPTIONS;
  return randomChoice(candidates, rng);
}

/**
 * 点数・役計算の入力
 * 点数計算入力
 *
 * 共通の和了状況（{@link AgariContext}）に、点数計算にだけ必要なドラ表示牌と
 * ルール設定を足したもの。
 */
interface ScoringInput extends AgariContext {
  readonly doraMarkers: readonly HaiKindId[];
  readonly ruleConfig: RuleConfig;
}

/**
 * ライブラリで点数と役を計算する
 * 点数役計算
 *
 * 役が1つも成立しない手（形式和了）は `calculateScoreForTehai` が Err で
 * 返す。和了できない手は出題にならないため undefined に変換する。
 */
function computeScoreAndYaku(
  tehai: Tehai14,
  context: ScoringInput,
):
  | {
      readonly answer: ScoreResult;
      readonly yakuResult: YakuResult;
    }
  | undefined {
  const { agariHai, isTsumo, jikaze, bakaze, doraMarkers, ruleConfig } =
    context;
  const answer = calculateScoreForTehai(tehai, {
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    ruleConfig,
  });
  if (answer.isErr()) return undefined;
  const yakuResult = detectYaku(tehai, {
    agariHai,
    bakaze,
    jikaze,
    doraMarkers,
    isTsumo,
    ruleConfig,
  });
  return { answer: answer.value, yakuResult };
}

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

  // 3. 点数・役の計算（ライブラリ境界）
  //    切り上げ満貫を含むルール設定はライブラリに渡し、点数区分・支払いの
  //    導出をすべてライブラリ側で行う。後付けの翻で再計算する経路
  //    （リーチ・内訳合わせ）にも同じ設定を渡すこと
  const ruleConfig: RuleConfig = {
    doubleWindJantouFu: doubleWindJantouFu(renfonpaiAs4Fu),
    kiriageMangan,
    ...yakumanRules,
  };
  const scored = computeScoreAndYaku(tehai, {
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    ruleConfig,
  });
  if (!scored) return undefined;

  //    役牌（三元牌・場風・自風）はライブラリが判定して返すので、ここで
  //    手牌を数えて補完しない。補完すると二重に数える
  let finalAnswer = scored.answer;
  let yakuDetails: YakuDetail[] = buildYakuDetailsFromResult(scored.yakuResult);

  // 4. リーチ・裏ドラの適用
  if (isRiichi && uraDoraMarkers) {
    const riichiRes = applyRiichiAndUraDora({
      tehai,
      currentAnswer: finalAnswer,
      uraDoraMarkers,
      isDoubleRiichi: randomBool(0.1, rng),
      isTsumo,
      jikaze,
      ruleConfig,
    });
    finalAnswer = riichiRes.answer;
    yakuDetails = [...yakuDetails, ...riichiRes.additionalYakuDetails];
  }

  // 5. 翻数を役の内訳に合わせる
  //
  //    内訳の合計を翻数の正典にし、内訳と翻数と点数が画面上で必ず一致する
  //    ことを保証する（結果ページが役の内訳を出すため、ここがずれると
  //    見えてしまう）。
  //
  //    ライブラリ 0.5 までは `detectYaku` と `calculateScoreForTehai` が同じ
  //    手牌で食い違うことがあった（門前の清一色・混一色・混全帯么九を含む手で
  //    後者が副露のときの値で数え、30000 手中 19 件で 1〜2 翻少なかった）。
  //    0.6 で両者の解釈が統一されて以降は一致するはずだが、内訳と翻数の
  //    一致は画面の前提なので、この補正は防波堤として残す。
  //
  //    この時点の `yakuDetails` は表ドラを持たない（`assembleScoreQuestion`
  //    が後で足す）ため、合計にはドラの翻を明示的に加える。
  const doraHan = countDoraInTehai(tehai, doraMarkers);
  const detailsHan =
    yakuDetails.reduce((total, yaku) => total + yaku.han, 0) + doraHan;
  if (detailsHan !== finalAnswer.han) {
    finalAnswer = recalculateScore(finalAnswer, detailsHan, {
      isTsumo,
      isOya: isOya(jikaze),
      ruleConfig,
    });
  }

  // 6. トリプル役満以上（役満3個分〜）は出題しない
  //     点数選択肢のリスト（RON_SCORES_KO 等）はダブル役満までしか持たず、
  //     選択肢から選べない問題になるため。ランダム生成では実質出ない手
  //     （大四喜ダブル+字一色 等）だが、防波堤として明示的に弾く
  if (finalAnswer.yakumanMultiplier >= 3) return undefined;

  // 7. 役満ルールの採否で正解が割れる手の除外
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

  // 8. 切り上げ満貫で点数が割れる手（30符4翻・60符3翻）の除外
  //    判定は翻数と符だけで行うため、切り上げ満貫を有効にして計算した
  //    結果（区分が既に満貫）でも境界の手を落とせる
  if (excludeKiriageBoundary && isKiriageManganTarget(finalAnswer))
    return undefined;

  // 9. 点数帯・最小翻数・符・役の検証と組み立て
  //    minHan はリーチ・裏ドラ適用後の最終翻数で判定する（出題表示と一致させる）
  if (!validateScoreRange(finalAnswer.scoreLevel, allowedRanges))
    return undefined;
  if (finalAnswer.han < minHan) return undefined;
  //    回答の符選択肢（FU_VALUES）に無い符は出題しない。么九牌の暗槓を複数
  //    含む手は 110符を超えることがあり（ライブラリの `Fu` は170符まで）、
  //    選択肢から選べない問題になるため
  if (!isFu(finalAnswer.fu)) return undefined;
  if (allowedFu !== undefined && !allowedFu.includes(finalAnswer.fu))
    return undefined;
  //    役の絞り込みも最終形の yakuDetails（役牌の照合・リーチ適用後）で判定する。
  //    複数指定は OR（いずれか1つでも成立していれば出題）
  if (
    requiredYaku !== undefined &&
    requiredYaku.length > 0 &&
    !yakuDetails.some((yaku) => requiredYaku.includes(yaku.name))
  )
    return undefined;

  return assembleScoreQuestion({
    tehai,
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    isRiichi,
    uraDoraMarkers,
    answer: finalAnswer,
    originalAnswer: scored.answer,
    yakuDetails,
  });
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

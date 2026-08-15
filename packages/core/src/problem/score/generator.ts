import {
  HaiKind,
  calculateScoreForTehai,
  detectYaku,
  isMenzen,
  type HaiKindId,
  type Kazehai,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import { ScoreLevel, KAZEHAI } from "../../core/constants";
import { randomChoice } from "../../core/random";

import type {
  ScoreQuestion,
  QuestionGeneratorOptions,
  ScoreRange,
  YakuDetail,
} from "./types";
import { reconcileYakuhai, applyRiichiAndUraDora } from "./utils/reconciler";
import { generateMentsuTehai } from "./strategies/mentsu-strategy";
import { generateChiitoiTehai } from "./strategies/chiitoi-strategy";
import { generateDoraMarkers } from "../shared/dora-utils";
import {
  assembleScoreQuestion,
  buildYakuDetailsFromResult,
} from "./assemble-question";
import { retryGenerate } from "../retry-generate";
import { countKantsu } from "../shared/count-kantsu";

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
function selectJikaze(includeParent: boolean, includeChild: boolean): Kazehai {
  let candidates: readonly Kazehai[] = KAZEHAI;
  if (!includeParent) candidates = candidates.filter((k) => k !== HaiKind.Ton);
  if (!includeChild) candidates = candidates.filter((k) => k === HaiKind.Ton);
  if (candidates.length === 0) candidates = KAZEHAI;
  return randomChoice(candidates);
}

/** 場風の候補（東場・南場） */
const BAKAZE_OPTIONS: readonly Kazehai[] = [HaiKind.Ton, HaiKind.Nan];

/** 和了状況（点数・役計算の入力） */
interface AgariContext {
  readonly agariHai: HaiKindId;
  readonly isTsumo: boolean;
  readonly jikaze: Kazehai;
  readonly bakaze: Kazehai;
  readonly doraMarkers: readonly HaiKindId[];
  readonly ruleConfig: { readonly doubleWindJantouFu: 2 | 4 };
}

/**
 * ライブラリで点数と役を計算する
 * 点数役計算
 *
 * `calculateScoreForTehai` / `detectYaku` は例外を投げうるため、
 * ライブラリ境界であるこの関数内でのみ try/catch で防御し undefined に変換する。
 */
function computeScoreAndYaku(
  tehai: Tehai14,
  context: AgariContext,
):
  | {
      readonly answer: ReturnType<typeof calculateScoreForTehai>;
      readonly yakuResult: ReturnType<typeof detectYaku>;
    }
  | undefined {
  const { agariHai, isTsumo, jikaze, bakaze, doraMarkers, ruleConfig } =
    context;
  try {
    const answer = calculateScoreForTehai(tehai, {
      agariHai,
      isTsumo,
      jikaze,
      bakaze,
      doraMarkers,
      ruleConfig,
    });
    const yakuResult = detectYaku(tehai, {
      agariHai,
      bakaze,
      jikaze,
      doraMarkers,
      isTsumo,
    });
    return { answer, yakuResult };
  } catch {
    return undefined;
  }
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
    includeChiitoi = false,
    includeParent = true,
    includeChild = true,
    renfonpaiAs4Fu = false,
    allowedRanges = ["nonMangan", "manganPlus"],
  } = options;

  // 1. 手牌の生成（七対子 or 面子手）
  const isChiitoi = includeChiitoi && Math.random() < 0.1;
  const tehaiResult = isChiitoi
    ? generateChiitoiTehai()
    : generateMentsuTehai(includeFuro);
  if (!tehaiResult) return undefined;
  const { tehai, agariHai } = tehaiResult;

  // 2. 和了状況の決定
  const isTsumo = Math.random() < 0.5;
  const jikaze = selectJikaze(includeParent, includeChild);
  const bakaze = randomChoice(BAKAZE_OPTIONS);
  const kantsuCount = countKantsu(tehai);
  const doraMarkers = generateDoraMarkers(kantsuCount);

  // 3. 点数・役の計算（ライブラリ境界）
  const scored = computeScoreAndYaku(tehai, {
    agariHai,
    isTsumo,
    jikaze,
    bakaze,
    doraMarkers,
    ruleConfig: { doubleWindJantouFu: renfonpaiAs4Fu ? 4 : 2 },
  });
  if (!scored) return undefined;

  // 4. 役牌の照合と補正
  let yakuDetails: YakuDetail[] = buildYakuDetailsFromResult(scored.yakuResult);
  const reconciled = reconcileYakuhai(
    tehai,
    scored.yakuResult,
    yakuDetails,
    scored.answer,
    bakaze,
    jikaze,
    isTsumo,
  );
  let finalAnswer = reconciled.answer;
  yakuDetails = [...yakuDetails, ...reconciled.additionalYakuDetails];
  if (finalAnswer.han === 0) return undefined;

  // 5. リーチ・裏ドラの適用（門前のみ、確率20%）
  //    リーチの抽選はここが唯一の判定。isRiichi が true の問題は必ず
  //    立直の翻と裏ドラ表示牌を持つ（出題表示と正解が食い違わない）。
  const isRiichi = isMenzen(tehai) && Math.random() < 0.2;
  let uraDoraMarkers: readonly HaiKindId[] | undefined;
  if (isRiichi) {
    const markers = generateDoraMarkers(kantsuCount);
    const riichiRes = applyRiichiAndUraDora({
      tehai,
      currentAnswer: finalAnswer,
      uraDoraMarkers: markers,
      isDoubleRiichi: Math.random() < 0.1,
      isTsumo,
      jikaze,
    });
    finalAnswer = riichiRes.answer;
    uraDoraMarkers = markers;
    yakuDetails = [...yakuDetails, ...riichiRes.additionalYakuDetails];
  }

  // 6. 点数帯の検証と組み立て
  if (!validateScoreRange(finalAnswer.scoreLevel, allowedRanges))
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

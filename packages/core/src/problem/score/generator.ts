import {
  HaiKind,
  calculateScoreForTehai,
  detectYaku,
  isMenzen,
  type HaiKindId,
  type Kazehai,
} from "@pai-forge/riichi-mahjong";
import { convertScoreDetailToFuDetails } from "../../score/fu-calculator";
import { ScoreLevel, getYakuNameJa, KAZEHAI } from "../../core/constants";
import { randomChoice } from "../../core/random";
import { countDoraInTehai } from "../../core/hai-names";

import type { ScoreQuestion, QuestionGeneratorOptions, YakuDetail } from "./types";
import { reconcileYakuhai, applyRiichiAndUraDora } from "./utils/reconciler";
import { generateMentsuTehai } from "./strategies/mentsu-strategy";
import { generateChiitoiTehai } from "./strategies/chiitoi-strategy";
import { generateDoraMarkers } from "../shared/dora-utils";

/**
 * 手牌中の槓子数をカウントする
 * 槓子数カウント
 */
function countKantsu(tehai: { readonly exposed: readonly { readonly type: string }[] }): number {
  return tehai.exposed.filter((mentsu) => mentsu.type === "Kantsu").length;
}

/**
 * 点数レベルが許可範囲内かどうかを検証する
 * 点数範囲検証
 */
function validateScoreRange(
  scoreLevel: string,
  allowedRanges: readonly ("non_mangan" | "mangan_plus")[],
): boolean {
  if (allowedRanges.length === 1 && allowedRanges[0] === "non_mangan" && scoreLevel !== ScoreLevel.Normal) return false;
  if (allowedRanges.length === 1 && allowedRanges[0] === "mangan_plus" && scoreLevel === ScoreLevel.Normal) return false;
  return true;
}

/**
 * 点数計算ドリルの問題を1つ生成する（生成不可能な場合は undefined を返す）
 * 点数計算ドリル問題生成
 */
export function generateScoreQuestion(options: QuestionGeneratorOptions = {}): ScoreQuestion | undefined {
  const { includeFuro = true, includeChiitoi = false, includeParent = true, includeChild = true } = options;

  const isChiitoi = includeChiitoi && Math.random() < 0.1;

  const tehaiResult = isChiitoi
    ? generateChiitoiTehai()
    : generateMentsuTehai(includeFuro);

  if (!tehaiResult) return undefined;

  const { tehai, agariHai } = tehaiResult;

  const isTsumo = Math.random() < 0.5;

  let validKazehai: Kazehai[] = [...KAZEHAI];
  if (!includeParent) validKazehai = validKazehai.filter((k) => k !== HaiKind.Ton);
  if (!includeChild) validKazehai = validKazehai.filter((k) => k === HaiKind.Ton);
  if (validKazehai.length === 0) validKazehai = [...KAZEHAI];

  const jikaze = randomChoice(validKazehai);
  const bakazeOptions: Kazehai[] = [HaiKind.Ton, HaiKind.Nan];
  const bakaze = randomChoice(bakazeOptions);

  const kantsuCount = countKantsu(tehai);
  const doraMarkers = generateDoraMarkers(kantsuCount);

  // ライブラリ境界の防御: calculateScoreForTehai / detectYaku は例外を投げうるため try/catch で保護
  try {
    const answer = calculateScoreForTehai(tehai, { agariHai, isTsumo, jikaze, bakaze, doraMarkers });
    const yakuResult = detectYaku(tehai, { agariHai, bakaze, jikaze, doraMarkers, isTsumo });
    let yakuDetails: YakuDetail[] = [];

    for (const [name, han] of yakuResult) {
      yakuDetails.push({ name: getYakuNameJa(name), han });
    }

    const reconciled = reconcileYakuhai(tehai, yakuResult, yakuDetails, answer, bakaze, jikaze, isTsumo);
    let finalAnswer = reconciled.answer;
    yakuDetails = [...yakuDetails, ...reconciled.additionalYakuDetails];
    if (finalAnswer.han === 0) return undefined;

    const isRiichi = isMenzen(tehai) && Math.random() < 0.2;
    let uraDoraMarkers: HaiKindId[] | undefined;

    if (isRiichi) {
      const riichiRes = applyRiichiAndUraDora(tehai, finalAnswer, yakuDetails, kantsuCount, isTsumo, jikaze);
      finalAnswer = riichiRes.answer;
      uraDoraMarkers = riichiRes.uraDoraMarkers;
      yakuDetails = [...yakuDetails, ...riichiRes.additionalYakuDetails];
    }

    const doraHan = countDoraInTehai(tehai, doraMarkers);
    if (doraHan > 0 && !yakuDetails.find((d) => d.name === "ドラ")) {
      yakuDetails = [...yakuDetails, { name: "ドラ", han: doraHan }];
    }

    const fuDetails = answer.detail
      ? convertScoreDetailToFuDetails(answer.detail, { agariHai, isTsumo, bakaze, jikaze })
      : undefined;

    const { allowedRanges = ["non_mangan", "mangan_plus"] } = options;

    if (!validateScoreRange(finalAnswer.scoreLevel, allowedRanges)) return undefined;

    return {
      tehai,
      agariHai,
      isTsumo,
      jikaze,
      bakaze,
      doraMarkers,
      isRiichi,
      uraDoraMarkers,
      answer: finalAnswer,
      fuDetails,
      yakuDetails,
    };
  } catch {
    return undefined;
  }
}

/**
 * 後方互換性のための薄いラッパークラス
 * @deprecated generateScoreQuestion を直接使用してください
 * 点数計算ドリル問題ジェネレータ
 */
export class ScoreQuestionGenerator {
  generate(options: QuestionGeneratorOptions = {}): ScoreQuestion | undefined {
    return generateScoreQuestion(options);
  }
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
  for (let i = 0; i < maxRetries; i++) {
    const question = generateScoreQuestion(options);
    if (question) return question;
  }
  return undefined;
}

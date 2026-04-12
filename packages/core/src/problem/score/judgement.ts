import type { ScoreQuestion, UserAnswer, JudgementResult } from "./types";
import { IGNORE_YAKU_FOR_JUDGEMENT, ScoreLevel } from "../../core/constants";

/**
 * 満貫以上かどうかを判定する
 * 満貫以上判定
 */
export function isMangan(scoreLevel: string): boolean {
  return (
    scoreLevel === ScoreLevel.Mangan ||
    scoreLevel === ScoreLevel.Haneman ||
    scoreLevel === ScoreLevel.Baiman ||
    scoreLevel === ScoreLevel.Sanbaiman ||
    scoreLevel === ScoreLevel.Yakuman ||
    scoreLevel === ScoreLevel.DoubleYakuman
  );
}

/**
 * 点数の判定
 * 点数一致判定
 */
function judgeScore(
  payment: ScoreQuestion["answer"]["payment"],
  userAnswer: Readonly<UserAnswer>,
): boolean {
  switch (payment.type) {
    case "ron":
      return userAnswer.score === payment.amount;
    case "oyaTsumo":
      return userAnswer.score === payment.amount;
    case "koTsumo":
      return (
        userAnswer.scoreFromKo === payment.amount[0] &&
        userAnswer.scoreFromOya === payment.amount[1]
      );
  }
}

/**
 * 役の判定
 * ドラ・裏ドラなどは無視して比較する
 * 役一致判定
 */
function judgeYaku(
  answerYakuDetails: ScoreQuestion["yakuDetails"],
  userYakus: readonly string[],
): boolean {
  if (!answerYakuDetails) return userYakus.length === 0;

  const expectedYakus = new Set(
    answerYakuDetails
      .map((d) => d.name)
      .filter((name) => !IGNORE_YAKU_FOR_JUDGEMENT.includes(name)),
  );

  const userYakuSet = new Set(userYakus);

  if (expectedYakus.size !== userYakuSet.size) return false;

  for (const yaku of expectedYakus) {
    if (!userYakuSet.has(yaku)) return false;
  }

  return true;
}

/**
 * 簡略化された翻数を取得する
 * 5翻以上をクラスごとの代表値に変換する
 * 翻数簡略化
 */
function getSimplifiedHan(han: number): number {
  if (han >= 13) return 13; // 役満
  if (han >= 11) return 11; // 三倍満
  if (han >= 8) return 8;   // 倍満
  if (han >= 6) return 6;   // 跳満
  if (han >= 5) return 5;   // 満貫
  return han;
}

/**
 * ユーザーの回答を判定する
 * ユーザー回答判定
 *
 * @param question - 問題
 * @param userAnswer - ユーザーの回答
 * @param requireYaku - 役の判定を必須とするかどうか
 * @param simplifyMangan - 満貫以上の翻数を簡略化するかどうか
 * @param requireFuForMangan - 満貫以上でも符の判定を必須とするかどうか
 */
export function judgeAnswer(
  question: Readonly<ScoreQuestion>,
  userAnswer: Readonly<UserAnswer>,
  requireYaku: boolean = false,
  simplifyMangan: boolean = false,
  requireFuForMangan: boolean = false,
): JudgementResult {
  const { answer } = question;
  const isManganOrAbove = isMangan(answer.scoreLevel);

  // 翻の判定
  let isHanCorrect = userAnswer.han === answer.han;

  if (simplifyMangan) {
    // 簡略化モード: 4翻以下でも満貫になる場合（60符3翻等）は「満貫（5翻扱い）」も正解とする
    if (isManganOrAbove && answer.han < 5 && userAnswer.han === 5) {
      isHanCorrect = true;
    } else if (userAnswer.han >= 5 || answer.han >= 5) {
      isHanCorrect = getSimplifiedHan(userAnswer.han) === getSimplifiedHan(answer.han);
    }
  }

  // 符の判定（満貫以上で符入力不要の場合は常に正解扱い）
  const isFuCorrect = (isManganOrAbove && !requireFuForMangan) || userAnswer.fu === answer.fu;

  // 点数の判定
  const isScoreCorrect = judgeScore(answer.payment, userAnswer);

  // 役の判定（役回答が必須でない場合は常に正解）
  const isYakuCorrect = requireYaku
    ? judgeYaku(question.yakuDetails, userAnswer.yakus)
    : true;

  const isCorrect = isHanCorrect && isFuCorrect && isScoreCorrect && isYakuCorrect;

  return {
    isCorrect,
    isHanCorrect,
    isFuCorrect,
    isScoreCorrect,
    isYakuCorrect,
  };
}

/**
 * 点数レベルを日本語に変換する
 * 点数レベル日本語変換
 */
export function getScoreLevelName(scoreLevel: string): string {
  switch (scoreLevel) {
    case ScoreLevel.Normal:
      return "";
    case ScoreLevel.Mangan:
      return "満貫";
    case ScoreLevel.Haneman:
      return "跳満";
    case ScoreLevel.Baiman:
      return "倍満";
    case ScoreLevel.Sanbaiman:
      return "三倍満";
    case ScoreLevel.Yakuman:
      return "役満";
    case ScoreLevel.DoubleYakuman:
      return "ダブル役満";
    default:
      return "";
  }
}

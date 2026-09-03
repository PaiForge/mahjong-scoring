import type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
  YakuSelectionJudgement,
  YakuSelectionState,
} from "./types";
import { IGNORE_YAKU_FOR_JUDGEMENT } from "../../core/yaku-names";
import {
  clampHanToYakuman,
  isMangan,
  MANGAN_MIN_HAN,
  scoreTierForHan,
} from "../../score/tiers";
import { setsEqual } from "../shared/set-equal";

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
 * 回答と突き合わせる正解の役名
 * ドラ・裏ドラなど、役として選ばせないものは除外する
 * 判定対象役名
 */
function expectedYakuNames(
  answerYakuDetails: ScoreQuestion["yakuDetails"],
): readonly string[] {
  return (answerYakuDetails ?? [])
    .map((d) => d.name)
    .filter((name) => !IGNORE_YAKU_FOR_JUDGEMENT.includes(name));
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
  return setsEqual(expectedYakuNames(answerYakuDetails), userYakus);
}

/**
 * 役ひとつひとつの答え合わせ結果
 * 役別判定
 *
 * 回答した役の集合が正解と一致するかだけを見る {@link judgeAnswer} と違い、
 * 「選んで合っていた（correct）」「選んだが役ではない（incorrect）」
 * 「正解だが選べなかった（missed）」を役ごとに返す。答え合わせの画面で
 * 「1つ余分なだけなのに回答全体が間違いに見える」ことを防ぐために使う。
 *
 * 並び順は正解の役（正解の並び順）→ 余分に選んだ役（選択順）。回答と正解を
 * 2列に並べて見せるとき、両列で同じ役が同じ順に並ぶようにするため。
 *
 * @param answerYakuDetails - 正解の役の内訳
 * @param userYakus - ユーザーが選択した役名
 */
export function judgeYakuSelection(
  answerYakuDetails: ScoreQuestion["yakuDetails"],
  userYakus: readonly string[],
): readonly YakuSelectionJudgement[] {
  const expected = expectedYakuNames(answerYakuDetails);
  const extra = userYakus.filter((name) => !expected.includes(name));

  return [...expected, ...extra].map((name): YakuSelectionJudgement => ({
    name,
    state: judgeYakuName(name, userYakus, expected),
  }));
}

/**
 * 役ひとつの答え合わせの状態を決める
 * 役別判定
 *
 * 選んで成立していれば `correct`、選んだが成立していなければ `incorrect`、
 * 選ばなかったものは `missed`。答え合わせに並ぶ役は「選んだ役」か「成立して
 * いた役」のどちらかなので、この 3 つで必ず尽きる。
 *
 * 役ごとに状態を持たせるのは、1 つ余分に選んだだけで回答全体が誤りとして
 * 表示されると、合っていた役まで間違いに見えてしまうため。
 */
export function judgeYakuName(
  yakuName: string,
  userYakus: readonly string[],
  expectedYakus: readonly string[],
): YakuSelectionState {
  if (!userYakus.includes(yakuName)) return "missed";
  return expectedYakus.includes(yakuName) ? "correct" : "incorrect";
}

/**
 * 簡略化された翻数を取得する
 * 5翻以上をクラスごとの代表値（区分の最小翻数）に変換する
 * 翻数簡略化
 *
 * ダブル役満区分（26翻〜）の代表値は、ダブル役満をルールとして採用して
 * いない出題では役満（13翻）に丸める。採用している出題では役満と
 * ダブル役満は別の答えなので丸めない（丸めると 26 翻の正解に 13 翻と
 * 答えても正解になってしまう）。
 */
function getSimplifiedHan(han: number, allowDoubleYakuman: boolean): number {
  const representative = scoreTierForHan(han)?.minHan ?? han;
  return allowDoubleYakuman
    ? representative
    : clampHanToYakuman(representative);
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
 * @param allowDoubleYakuman - ダブル役満を採用したルールでの出題かどうか。
 *   採用時は 26 翻を役満（13翻）へ丸めずに別の答えとして判定する
 */
export function judgeAnswer(
  question: Readonly<ScoreQuestion>,
  userAnswer: Readonly<UserAnswer>,
  requireYaku: boolean = false,
  simplifyMangan: boolean = false,
  requireFuForMangan: boolean = false,
  allowDoubleYakuman: boolean = false,
): JudgementResult {
  const { answer } = question;
  const isManganOrAbove = isMangan(answer.scoreLevel);

  // 翻の判定
  let isHanCorrect = userAnswer.han === answer.han;

  if (simplifyMangan) {
    // 簡略化モード: 4翻以下でも満貫になる場合（60符3翻等）は「満貫（5翻扱い）」も正解とする
    if (
      isManganOrAbove &&
      answer.han < MANGAN_MIN_HAN &&
      userAnswer.han === MANGAN_MIN_HAN
    ) {
      isHanCorrect = true;
    } else if (
      userAnswer.han >= MANGAN_MIN_HAN ||
      answer.han >= MANGAN_MIN_HAN
    ) {
      isHanCorrect =
        getSimplifiedHan(userAnswer.han, allowDoubleYakuman) ===
        getSimplifiedHan(answer.han, allowDoubleYakuman);
    }
  }

  // 符の判定（満貫以上で符入力不要の場合は常に正解扱い）
  const isFuCorrect =
    (isManganOrAbove && !requireFuForMangan) || userAnswer.fu === answer.fu;

  // 点数の判定
  const isScoreCorrect = judgeScore(answer.payment, userAnswer);

  // 役の判定（役回答が必須でない場合は常に正解）
  const isYakuCorrect = requireYaku
    ? judgeYaku(question.yakuDetails, userAnswer.yakus)
    : true;

  const isCorrect =
    isHanCorrect && isFuCorrect && isScoreCorrect && isYakuCorrect;

  return {
    isCorrect,
    isHanCorrect,
    isFuCorrect,
    isScoreCorrect,
    isYakuCorrect,
  };
}

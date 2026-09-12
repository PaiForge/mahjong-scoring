import type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
  YakuSelectionJudgement,
  YakuSelectionState,
} from "./types";
import {
  getYakuNameJa,
  IGNORE_YAKU_FOR_JUDGEMENT,
} from "../../core/yaku-names";
import { getKazeYakuhaiDisplayName } from "../yaku/constants";
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
 *
 * 支払い形ごとに突き合わせるフィールドが決まるという規則は、点数表早引きの
 * judgeScoreTableAnswer（`problem/score-table/judgement.ts`）と同じ。
 * 扱う形が違うため共通化していない（理由はあちらの TSDoc に書いた）。
 * 突き合わせ方そのものを変えるときは両方を直すこと。
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
 * 役の判定に要る出題の一部（役の内訳と局面の風）
 * 役判定の入力
 *
 * 内訳が無い出題（保存を始める前の旧データ）も受けるため `yakuDetails` は
 * 任意。風は場風牌 / 自風牌を選択肢の名前に引き直すのに要る。
 */
export type YakuJudgementSource = Pick<ScoreQuestion, "bakaze" | "jikaze"> & {
  readonly yakuDetails?: ScoreQuestion["yakuDetails"];
};

/** 内訳が場風・自風の役牌を名乗るときの名前（core/yaku-names の対応表が唯一の定義） */
const BAKAZE_NAME = getYakuNameJa("Bakaze");
const JIKAZE_NAME = getYakuNameJa("Jikaze");

/**
 * 回答と突き合わせる正解の役名
 * 判定対象役名
 *
 * ドラ・裏ドラなど、役として選ばせないものは除外する。
 *
 * 内訳の「場風牌」「自風牌」は局面の風で「役牌 東」のような名前に引き直す。
 * 回答の選択肢は風ごとの 1 つ（東・南・西・北）だけで、場風 / 自風という
 * 選択肢は無いため、内訳の名前のまま比べると風牌の役牌は選びようがなく
 * 必ず不正解になる。連風牌（場風＝自風）は両方が同じ名前になるので 1 つに
 * まとめる — 役の回答で問うのは名前だけで、2 翻ぶんは翻数の行が別に問う
 * （内訳には場風牌 / 自風牌が 1 翻ずつ残るので、なぜ 2 翻かはそこで読める）。
 * 役の選択練習（`problem/yaku/generator.ts`）と同じ扱い。
 */
function expectedYakuNames(
  source: Readonly<YakuJudgementSource>,
): readonly string[] {
  const names: string[] = [];
  for (const { name } of source.yakuDetails ?? []) {
    if (IGNORE_YAKU_FOR_JUDGEMENT.includes(name)) continue;
    const resolved =
      name === BAKAZE_NAME
        ? getKazeYakuhaiDisplayName(source.bakaze)
        : name === JIKAZE_NAME
          ? getKazeYakuhaiDisplayName(source.jikaze)
          : name;
    if (resolved !== undefined && !names.includes(resolved)) {
      names.push(resolved);
    }
  }
  return names;
}

/**
 * 役の判定
 * ドラ・裏ドラなどは無視して比較する
 * 役一致判定
 */
function judgeYaku(
  source: Readonly<YakuJudgementSource>,
  userYakus: readonly string[],
): boolean {
  return setsEqual(expectedYakuNames(source), userYakus);
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
 * 正解の役名は {@link expectedYakuNames} が選択肢の名前に引き直したもの
 * （場風牌 → 役牌 東 など）なので、答え合わせの画面にもその名前で出る。
 *
 * @param source - 正解の役の内訳と局面の風
 * @param userYakus - ユーザーが選択した役名
 */
export function judgeYakuSelection(
  source: Readonly<YakuJudgementSource>,
  userYakus: readonly string[],
): readonly YakuSelectionJudgement[] {
  const expected = expectedYakuNames(source);
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
    ? judgeYaku(question, userAnswer.yakus)
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

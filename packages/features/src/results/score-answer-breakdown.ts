import type { ScoreQuestion, YakuDetail } from "@mahjong-scoring/core";

import { resolveFuVisibility } from "./fu-visibility";
import type { ScoreBreakdownFu } from "./score-breakdown-tabs";
import {
  buildYakumanCapNote,
  type YakuBreakdownTranslator,
} from "./yakuman-cap-note";

/** 点数を答える練習の答え合わせの内訳（`ScoreBreakdownPanel` に渡す値） */
export interface ScoreAnswerBreakdown {
  /** 符の内訳と正解の符。符を出さない問題（5 翻以上）では undefined */
  readonly fu: ScoreBreakdownFu | undefined;
  /** 役の内訳。役一覧が与件として出ている練習では空（翻数の内訳を出さない） */
  readonly yakuDetails: readonly YakuDetail[];
  /** 翻数の合計の後に効く丸めの補足（役満止まりなど） */
  readonly yakuNote: string | undefined;
}

/**
 * 答え合わせの内訳に開くものが 1 つでもあるか
 * 答え合わせ内訳有無
 *
 * 役一覧が与件で 5 翻以上の手（満貫以上の点数計算の大半）では符も翻数も
 * 無く、`ScoreBreakdownPanel` は何も描かない。面子分解も持たない手
 * （国士無双等）で答え合わせの資料の面が空の枠にならないよう、置く前に
 * これで確かめる。
 */
export function hasScoreAnswerBreakdown(
  breakdown: ScoreAnswerBreakdown,
): boolean {
  return breakdown.fu !== undefined || breakdown.yakuDetails.length > 0;
}

/** 内訳のうち、出題の側で既に見えているもの */
export interface ScoreAnswerBreakdownOptions {
  /**
   * 役一覧を与件として手牌の直下に出している練習か
   *
   * 満貫以上の点数計算は役と翻数を与えたうえで点数だけを答えさせる。翻数の
   * 内訳は与件の役一覧と同じ表になるため、答え合わせには符の内訳だけを出す。
   * 点数即答と昇級試験（模試）は役を出さないので false
   */
  readonly yakuGiven: boolean;
}

/**
 * 点数を答える練習・模試の答え合わせに出す内訳を組み立てる
 * 答え合わせ内訳
 *
 * 点数の練習（点数即答・満貫以上の点数計算）のトレーニングと点数計算の
 * 昇級試験の模試が、web とモバイルの両方で共有する。どれも符を答えさせない
 * ので、符の内訳は 4 翻以下だけ出す（符で満貫に届いた手は出し、5 翻以上は
 * 符が点数に効かないので出さない。結果ページの問題別詳細と同じ境目）。
 *
 * @param question - 出題
 * @param t - `challenge.yakuBreakdown` の翻訳関数
 * @param options - 出題の側で既に見えている内訳
 */
export function buildScoreAnswerBreakdown(
  question: Readonly<ScoreQuestion>,
  t: YakuBreakdownTranslator,
  { yakuGiven }: ScoreAnswerBreakdownOptions,
): ScoreAnswerBreakdown {
  const { fuDetails, answer } = question;
  const yakuDetails = yakuGiven ? [] : question.yakuDetails;
  return {
    fu:
      fuDetails !== undefined &&
      resolveFuVisibility(answer, { requireFuForMangan: false }).breakdown
        ? { details: fuDetails, answer: answer.fu }
        : undefined,
    yakuDetails,
    yakuNote: yakuGiven
      ? undefined
      : buildYakumanCapNote(question.yakuDetails, answer.yakumanMultiplier, t),
  };
}

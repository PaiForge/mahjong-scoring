import type { ScoreQuestion, YakuDetail } from "@mahjong-scoring/core";

import { resolveFuVisibility } from "../results/fu-visibility";
import type { ScoreBreakdownFu } from "../results/score-breakdown-tabs";
import {
  buildYakumanCapNote,
  type YakuBreakdownTranslator,
} from "../results/yakuman-cap-note";

/** 昇級試験の答え合わせの内訳（`ScoreBreakdownPanel` に渡す値） */
export interface ScoreExamBreakdown {
  /** 符の内訳と正解の符。符を出さない問題（5 翻以上）では undefined */
  readonly fu: ScoreBreakdownFu | undefined;
  /** 役の内訳 */
  readonly yakuDetails: readonly YakuDetail[];
  /** 翻数の合計の後に効く丸めの補足（役満止まりなど） */
  readonly yakuNote: string | undefined;
}

/**
 * 点数計算の昇級試験の答え合わせに出す内訳を組み立てる
 * 昇級試験内訳
 *
 * 試験は符を答えさせないので、符の内訳は 4 翻以下だけ出す（符で満貫に
 * 届いた手は出し、5 翻以上は符が点数に効かないので出さない）。web と
 * モバイルの `createScoreExamBoard` が共有する。
 *
 * @param question - 出題
 * @param t - `challenge.yakuBreakdown` の翻訳関数
 */
export function buildScoreExamBreakdown(
  question: Readonly<ScoreQuestion>,
  t: YakuBreakdownTranslator,
): ScoreExamBreakdown {
  const { fuDetails, answer } = question;
  return {
    fu:
      fuDetails !== undefined &&
      resolveFuVisibility(answer, { requireFuForMangan: false }).breakdown
        ? { details: fuDetails, answer: answer.fu }
        : undefined,
    yakuDetails: question.yakuDetails,
    yakuNote: buildYakumanCapNote(
      question.yakuDetails,
      answer.yakumanMultiplier,
      t,
    ),
  };
}

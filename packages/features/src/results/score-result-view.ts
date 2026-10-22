import type {
  JudgementResult,
  ScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";

import type { FuHanOrder } from "../settings/fu-han-order";
import type { BreakdownKind } from "./breakdown-tabs";
import {
  buildScoreResultDisplay,
  resolveScoreResultBreakdown,
  type ScoreResultBreakdownTab,
  type ScoreResultDisplay,
} from "./score-result-display";

/** 判定付きの回答。無回答の正解開示（「わからない」）では無い */
export interface JudgedScoreAnswer {
  readonly answer: UserAnswer;
  readonly result: JudgementResult;
}

/** 答え合わせの表を組むための入力 */
export interface ScoreResultViewInput {
  readonly question: ScoreQuestion;
  readonly userAnswer: UserAnswer | undefined;
  readonly result: JudgementResult | undefined;
  /** 翻数と符を答えさせたか。答えさせていない設定では翻数・符の行の判定を見せない */
  readonly requireHanFu: boolean;
  /** 満貫以上でも符を答えさせる設定か */
  readonly requireFuForMangan: boolean;
  /** 役の表示順（設定） */
  readonly yakuOrder: readonly string[];
  /** 符と翻の表記順（設定） */
  readonly fuHanOrder: FuHanOrder;
}

/**
 * 答え合わせの表に出す値の一式
 * 点数計算の答え合わせの表示
 */
export interface ScoreResultView extends ScoreResultDisplay {
  /** 判定付きの回答。無回答の開示では undefined */
  readonly judged: JudgedScoreAnswer | undefined;
  /** 翻数・符の行の「あなたの回答」。答えさせていない設定では undefined */
  readonly judgedHanFu: JudgedScoreAnswer | undefined;
  /** 成立していた役の名前（役一覧に印を付ける） */
  readonly correctYakuNames: readonly string[];
  /** 符の行を出すか（満貫以上は出さない） */
  readonly showsFu: boolean;
  /** 内訳の切り替え（表記順）。無ければ空 */
  readonly breakdownTabs: readonly ScoreResultBreakdownTab[];
  /** 内訳を開いたときに選ぶ種類（間違えたほう） */
  readonly initialBreakdown: BreakdownKind | undefined;
}

/**
 * 点数計算の答え合わせの表に出す値を導く
 * 点数計算の答え合わせの導出
 *
 * web とアプリの `ResultDisplay` が共有する。役の振り分け・内訳の並び・
 * 符の行の有無・判定の見せ方をここで決め、画面は値を並べるだけにする。
 */
export function resolveScoreResultView(
  input: ScoreResultViewInput,
): ScoreResultView {
  const { question, userAnswer, result } = input;
  const judged =
    userAnswer !== undefined && result !== undefined
      ? { answer: userAnswer, result }
      : undefined;
  const display = buildScoreResultDisplay(
    question,
    userAnswer?.yakus,
    input.yakuOrder,
  );
  const breakdown = resolveScoreResultBreakdown(question.answer, display, {
    order: input.fuHanOrder,
    requireFuForMangan: input.requireFuForMangan,
    judgement: judged?.result,
  });
  return {
    ...display,
    judged,
    judgedHanFu: input.requireHanFu ? judged : undefined,
    correctYakuNames: display.correctYakuJudgements.map(
      (judgement) => judgement.name,
    ),
    showsFu: breakdown.showsFu,
    breakdownTabs: breakdown.tabs,
    initialBreakdown: breakdown.initial,
  };
}

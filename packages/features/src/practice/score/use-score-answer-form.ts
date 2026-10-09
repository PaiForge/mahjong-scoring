"use client";

import { useState } from "react";
import { paymentKindOf } from "@mahjong-scoring/core";
import type {
  KoTsumoPayment,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";
import type { KoTsumoInputMode } from "../../settings/ko-tsumo-input";
import { useTrainingMode } from "../use-training-mode";
import {
  getAvailableScores,
  type AvailableScores,
  type ScoreOptionRange,
} from "./get-available-scores";
import {
  resolveScoreSelection,
  type ScoreInput,
  type ScoreSelection,
} from "./score-selection";

export interface UseScoreAnswerFormParams {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /**
   * 点数の選択肢をこの範囲に固定する（省略時は翻数から絞る）。
   * 出題が範囲を固定している練習（昇級試験）が渡す。
   */
  readonly scoreRange?: ScoreOptionRange;
  /**
   * 選択完了時に自動送信する（「回答する」ボタンを押さずに送信扱いにする）。
   * 単一選択・子ツモの組の select は値が選ばれた時点、子ツモの分割入力は
   * 2 つとも選ばれた時点で送信する。
   */
  readonly autoSubmit?: boolean;
  /** 端末のルール設定の切り上げ満貫 */
  readonly kiriageMangan: boolean;
  /**
   * ダブル役満を採用したルールでの出題か。採用時はダブル役満の点数
   * （子64000点等）を選択肢に足す。
   */
  readonly allowDoubleYakuman?: boolean;
  /**
   * 選択肢を端末のルール設定（切り上げ満貫・ダブル役満）に依らない集合に
   * 固定する。記録が残るチャレンジと昇級試験が立てる。設定で選択肢の個数が
   * 変わると同じ土俵の中で有利不利が出るため（`challenge/rule-boundary.ts`）。
   * true のとき `kiriageMangan` / `allowDoubleYakuman` は無視する。
   */
  readonly fixedRules?: boolean;
  /** 子ツモの入力方式（端末の表示設定。アプリ側がストアから読んで渡す） */
  readonly koTsumoInput: KoTsumoInputMode;
}

export interface UseScoreAnswerFormResult {
  readonly availableScores: AvailableScores;
  /** 親ツモか（選択肢に「オール」を添える） */
  readonly isOyaTsumo: boolean;
  /** ロン・親ツモで選んだ点数 */
  readonly score: number | undefined;
  /** 子ツモの子からの点数 */
  readonly scoreFromKo: number | undefined;
  /** 子ツモの親からの点数 */
  readonly scoreFromOya: number | undefined;
  /** 子ツモをまとめた select で選んだ組 */
  readonly koTsumoPayment: KoTsumoPayment | undefined;
  readonly selectScore: (value: number) => void;
  readonly selectFromKo: (value: number) => void;
  readonly selectFromOya: (value: number) => void;
  readonly selectKoTsumoPayment: (payment: KoTsumoPayment) => void;
  /**
   * 入力が揃ったか（子ツモは 2 つとも）。揃うまで「回答する」ボタンを押せなく
   * する — 押せるのに何も起きない状態を作らないため
   */
  readonly isComplete: boolean;
  /** 「回答する」ボタンの送信。入力が揃っていなければ何もしない */
  readonly submit: () => void;
  /**
   * 「回答する」ボタンを出すか。自動送信では出さず、トレーニングの回答後は
   * シェルが同じ位置に「次の問題へ」を出すので引っ込める
   */
  readonly showsSubmitButton: boolean;
}

/**
 * 点数を select で答える回答フォームの状態
 * 点数回答フォーム状態
 *
 * 選択肢の絞り込み・選んだ点数・自動送信・送信する回答の組み立てを持つ。
 * 選んだ点数・「揃ったか」・送る回答は、どれも今の選択肢に存在する値だけを
 * 見る（{@link resolveScoreSelection}）。
 * 問題が変わったときの入力リセットは、呼び出し元が `key` に出題番号を
 * 渡して再マウントさせることで行う。
 */
export function useScoreAnswerForm({
  isOya,
  isTsumo,
  han,
  onSubmit,
  disabled = false,
  scoreRange,
  autoSubmit = false,
  kiriageMangan,
  allowDoubleYakuman = false,
  fixedRules = false,
  koTsumoInput,
}: UseScoreAnswerFormParams): UseScoreAnswerFormResult {
  const { isHolding } = useTrainingMode();
  const [input, setInput] = useState<ScoreInput>(EMPTY_INPUT);

  const isOyaTsumo = paymentKindOf(isOya, isTsumo) === "oyaTsumo";
  const availableScores = getAvailableScores({
    han,
    isOya,
    isTsumo,
    scoreRange,
    kiriageMangan: fixedRules ? false : kiriageMangan,
    doubleYakuman: fixedRules ? false : allowDoubleYakuman,
    koTsumoInput,
  });
  const selection = resolveScoreSelection(availableScores, input);

  /** 揃った選択から送る回答を組み立てる（揃っていなければ undefined） */
  const answerOf = (s: ScoreSelection): ScoreTableUserAnswer | undefined => {
    if (!s.isComplete) return undefined;
    if (s.scoreFromKo !== undefined && s.scoreFromOya !== undefined) {
      return {
        type: "koTsumo",
        fromKo: s.scoreFromKo,
        fromOya: s.scoreFromOya,
      };
    }
    if (s.score === undefined) return undefined;
    return isOyaTsumo
      ? { type: "oyaTsumo", all: s.score }
      : { type: "ron", score: s.score };
  };

  const submit = () => {
    const answer = answerOf(selection);
    if (answer) onSubmit(answer);
  };

  // 入力を書き換え、自動送信なら書き換えた後の選択が揃った時点で送る
  const select = (patch: Partial<ScoreInput>) => {
    const next = { ...input, ...patch };
    setInput(next);
    if (!autoSubmit || disabled) return;
    const answer = answerOf(resolveScoreSelection(availableScores, next));
    if (answer) onSubmit(answer);
  };

  return {
    availableScores,
    isOyaTsumo,
    score: selection.score,
    scoreFromKo: selection.scoreFromKo,
    scoreFromOya: selection.scoreFromOya,
    koTsumoPayment: selection.koTsumoPayment,
    selectScore: (score) => select({ score }),
    selectFromKo: (scoreFromKo) => select({ scoreFromKo }),
    selectFromOya: (scoreFromOya) => select({ scoreFromOya }),
    selectKoTsumoPayment: ({ fromKo, fromOya }) =>
      select({ scoreFromKo: fromKo, scoreFromOya: fromOya }),
    isComplete: selection.isComplete,
    submit,
    showsSubmitButton: !autoSubmit && !isHolding,
  };
}

const EMPTY_INPUT: ScoreInput = {
  score: undefined,
  scoreFromKo: undefined,
  scoreFromOya: undefined,
};

import { useState } from "react";
import type {
  JudgementResult,
  MachiCellAnswer,
  ScoreQuestion,
  TenpaiScoreQuestion,
} from "@mahjong-scoring/core";

import {
  cellKeyOf,
  cellQuestionOf,
  listCellRefs,
  type MachiCellRef,
} from "./cell-ref";

/** 聴牌形の答え合わせで選んでいるマスと、その中身 */
export interface TenpaiScoreResultFocus {
  /** 出題のすべてのマス（タブの並び） */
  readonly cells: readonly MachiCellRef[];
  /** 選んでいるマス。初めは先頭 */
  readonly focused: MachiCellRef;
  readonly setFocused: (cell: MachiCellRef) => void;
  /** 選んでいるマスのキー */
  readonly focusedKey: string;
  /** 選んでいるマスの出題。出題を持たないマスでは undefined */
  readonly focusedQuestion: ScoreQuestion | undefined;
  /** 選んでいるマスの回答 */
  readonly focusedAnswer: MachiCellAnswer | undefined;
  /** 選んでいるマスの判定。「わからない」での開示では undefined */
  readonly focusedResult: JudgementResult | undefined;
}

/**
 * 聴牌形の点数計算の答え合わせで、タブで選んでいるマスとその中身を持つ
 * 聴牌形結果のマス選択
 *
 * web・モバイルの `TenpaiScoreResult` が共有する。マスはタブで 1 つずつ
 * 見せ、選んだマスの出題・回答・判定をタブの下のパネルに出す。
 *
 * @param question - 聴牌形の出題
 * @param cellAnswers - マスごとの回答
 * @param cellResults - マスごとの判定。「わからない」での開示では undefined
 */
export function useTenpaiScoreResultFocus(
  question: Readonly<TenpaiScoreQuestion>,
  cellAnswers: Readonly<Record<string, MachiCellAnswer>>,
  cellResults: Readonly<Record<string, JudgementResult>> | undefined,
): TenpaiScoreResultFocus {
  const cells = listCellRefs(question);
  const [focused, setFocused] = useState<MachiCellRef>(cells[0]);
  const focusedKey = cellKeyOf(focused);

  return {
    cells,
    focused,
    setFocused,
    focusedKey,
    focusedQuestion: cellQuestionOf(question, focused),
    focusedAnswer: cellAnswers[focusedKey],
    focusedResult: cellResults?.[focusedKey],
  };
}

"use client";

import { generateTotalFuQuestion, retryGenerate } from "@mahjong-scoring/core";
import { TotalFuQuestionBoard } from "@/app/(user)/(public)/practice/_components/total-fu-question-board";
import type { RecordingPracticeBoardProps } from "@/app/(user)/(public)/practice/_lib/practice-board-props";
import {
  EXAM_GENERATE_OPTIONS,
  EXAM_GENERATION_MAX_RETRIES,
} from "@mahjong-scoring/features/exam/fu/types";
import type { FuExamQuestionResult } from "@mahjong-scoring/features/exam/fu/types";

type FuExamBoardProps = RecordingPracticeBoardProps<FuExamQuestionResult>;

/** 本番と模試で同じ条件の 1 問（依存が無いのでモジュールに置いて参照を固定する） */
function generateExamQuestion() {
  return retryGenerate(
    () => generateTotalFuQuestion(EXAM_GENERATE_OPTIONS),
    EXAM_GENERATION_MAX_RETRIES,
  );
}

/**
 * 昇級試験（手牌の合計符）の出題盤面（手牌の提示と符の選択）
 * 昇級試験盤面
 *
 * `TotalFuBoard` と同じ構図（{@link TotalFuQuestionBoard}）だが、本番の試験では
 * 符の内訳を一切出さない（内訳は回答の答え合わせそのもので、試験中に見せる
 * 情報ではない）。振り返りは結果ページの問題別フィードバック一覧で行う。
 *
 * 同じ盤面を模試（`/exam/fu/training`。時間無制限・記録なしのトレーニング）
 * でも描く。模試では回答後の停止中と「わからない」の開示中に内訳を出す
 * （合計符の練習のトレーニングと同じ答え合わせ）。出題条件は本番と同じ。
 *
 * ルール設定ストア（連風牌4符）を意図的に読まない: 出題は
 * `EXAM_GENERATE_OPTIONS` が場風＝自風の局面を除いており、設定は符に影響
 * しないため、端末設定に関係なく全受験者が同一条件になる。
 */
export function FuExamBoard(props: FuExamBoardProps) {
  return (
    <TotalFuQuestionBoard
      {...props}
      generateQuestion={generateExamQuestion}
      translationNamespace="fuExamChallenge"
      // 選択肢が 11 個並ぶぶん他の試験より高い（`loading.tsx` と同じ tall）
      boardHeight="fuExam"
    />
  );
}

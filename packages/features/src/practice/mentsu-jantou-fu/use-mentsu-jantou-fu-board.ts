"use client";

import { useCallback, useState } from "react";
import {
  generateMentsuJantouFuQuestion,
  retryGenerate,
} from "@mahjong-scoring/core";
import type { MentsuJantouFuQuestion } from "@mahjong-scoring/core";
import type { RecordingPracticeBoardProps } from "../board-props";
import { useGeneratedQuestion } from "../use-generated-question";
import { useGradeAndRecord } from "../use-grade-answer";
import { usePresentQuestion } from "../use-present-question";
import { useRegisterAdvance, useTrainingMode } from "../use-training-mode";
import { toQuestionResult, type MentsuJantouFuQuestionResult } from "./types";

/** 行ごとに選んだ符（未選択の行は undefined） */
export type MentsuJantouFuRowAnswers = readonly (number | undefined)[];

const NO_ANSWERS: MentsuJantouFuRowAnswers = [];

/** 出題中の問題を回答なしの結果に組む（時間切れの届け出用） */
function toUnansweredResult(
  question: MentsuJantouFuQuestion,
): MentsuJantouFuQuestionResult {
  return toQuestionResult(question, undefined);
}

interface UseMentsuJantouFuBoardResult {
  /** 現在の問題。最初の問題はクライアントで生成するため、それまでは undefined */
  readonly question: MentsuJantouFuQuestion | undefined;
  readonly answers: MentsuJantouFuRowAnswers;
  /**
   * 「わからない」で正解を開示中か。無回答のまま答え合わせが立つため、
   * 行は誤答の演出を出さず正解の符だけを示す
   */
  readonly isRevealed: boolean;
  /** 行 `index` の符を選ぶ。全行が埋まった時点で送る */
  readonly handleSelect: (index: number, fu: number) => void;
}

/**
 * 面子と雀頭の符の練習の出題状態と回答ロジック
 * 面子雀頭符ボード
 *
 * 最後の要素を選んだ時点で送信し、「回答する」ボタンは置かない。各行は
 * 単一選択で行数は出題が決めるため「全行が埋まった」という完成点が盤面から
 * 決まり、子ツモの点数（「子から / 親から」の 2 つが揃ったら送信）と同じ
 * 構造になる。全行が埋まるまで無効なボタンは、有効になった瞬間に押す以外の
 * 使い道が無く、制限時間の中では同じ答えをもう一度言う 1 タップがそのまま
 * 持ち時間を削る。
 *
 * 最後に触った行がそのまま確定になるので、埋め終えてからの見直しはできない。
 * 単一選択の盤面（雀頭符・面子符・待ち符・合計符・翻数即答）が 1 タップで
 * 確定するのと同じ割り切りで、直したい行は最後の行を選ぶ前に直す。
 *
 * 役判定だけは「回答する」ボタンが残る。成立する役の個数は出題ごとに違い
 * 解く側にも分からないため、「全部選んだ」という完成点が盤面から決まらない。
 */
export function useMentsuJantouFuBoard({
  renfonpaiAs4Fu,
  showFeedback,
  onAnswer,
  onRecordResult,
  onPresentQuestion,
}: Pick<
  RecordingPracticeBoardProps<MentsuJantouFuQuestionResult>,
  "showFeedback" | "onAnswer" | "onRecordResult" | "onPresentQuestion"
> & {
  /** 連風牌の雀頭を 4 符とするか（端末ローカルのルール設定） */
  readonly renfonpaiAs4Fu: boolean;
}): UseMentsuJantouFuBoardResult {
  const generate = useCallback(
    (): MentsuJantouFuQuestion | undefined =>
      retryGenerate(() => generateMentsuJantouFuQuestion({ renfonpaiAs4Fu })),
    [renfonpaiAs4Fu],
  );
  const [question, setQuestion] = useGeneratedQuestion(generate);
  const [answers, setAnswers] = useState<MentsuJantouFuRowAnswers>(NO_ANSWERS);

  const advanceQuestion = useCallback(() => {
    setQuestion(generate());
    setAnswers(NO_ANSWERS);
  }, [generate, setQuestion]);

  useRegisterAdvance(question === undefined ? undefined : advanceQuestion);
  usePresentQuestion(question, toUnansweredResult, onPresentQuestion);
  const { isRevealed } = useTrainingMode();
  const gradeAndRecord = useGradeAndRecord(toQuestionResult, {
    onRecordResult,
    onAnswer,
    advance: advanceQuestion,
  });

  // 選んだ結果を先に確定してから「全行が埋まったか」を見る。関数型の更新に
  // 送信を混ぜると StrictMode の二重呼び出しで 2 回送ることになる
  const handleSelect = useCallback(
    (index: number, fu: number) => {
      if (!question || showFeedback) return;
      const next = question.items.map((_, i) =>
        i === index ? fu : answers[i],
      );
      setAnswers(next);
      const filled = next.filter((value) => value !== undefined);
      if (filled.length === question.items.length)
        gradeAndRecord(question, filled);
    },
    [question, answers, showFeedback, gradeAndRecord],
  );

  return { question, answers, isRevealed, handleSelect };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { QuestionHost } from "../practice/use-question-host";
import type { PracticeQuotaGate } from "./gate";
import type { PracticeQuotaControl } from "./use-practice-quota-control";

/**
 * プラットフォームの回数制限のゲート（web / アプリの `usePracticeQuota`）
 * 回数制限ゲートのフック
 *
 * 練習（回数制限の単位）は呼び出し側が束ねておき、許可されたときに呼ぶ
 * 生成処理だけを受け取る形で渡す。問い合わせ先（Server Action・アプリ向け
 * API と端末の数え方）の違いはこの中に畳まれる。
 */
export type UsePracticeQuota = (generate: () => void) => PracticeQuotaControl;

/**
 * 回数制限に通した出題ホスト（{@link useQuotaQuestionHost} の戻り値）
 * 回数制限付き出題ホスト
 */
export interface QuotaQuestionHost {
  /** 盤面へ `QuestionHostProvider` で渡す出題ホスト */
  readonly host: QuestionHost;
  /** 直近の出題許可の結果。開いた直後の 1 問を聞くまでは undefined */
  readonly gate: PracticeQuotaGate | undefined;
  /** 返事を待っている間 true */
  readonly isChecking: boolean;
}

/**
 * 模試の出題を回数制限のゲートに通す出題ホスト
 * 回数制限付き出題ホスト
 *
 * 昇級試験の盤面は自分で問題を作る（`useGeneratedQuestion`）が、出題ホストが
 * あればホストの問題を使い、次へ進む操作もホストに委ねる。記録ありの
 * チャレンジがサーバーの出題にこれを使うのと同じ口で、模試では「1 問始めて
 * よいか」を回数制限に聞いてから端末で問題を作るホストを差し込む。盤面は
 * 回数制限を知らず、本番（ホスト無し・サーバー出題）と模試で同じコードのまま。
 *
 * - 開いた直後に最初の 1 問を聞く（前の模試のペイウォールは消してから。
 *   `requestFirstQuestion`）
 * - 次へ進むと問題を消してから聞く。返事が届くまで盤面は生成待ちの
 *   プレースホルダを出し、「わからない」も押せない（問題が無い間は盤面が
 *   次へ進む操作を登録しないため）。前の問題を出したままにすると、返事を
 *   待つ間に同じ問題へもう一度答えられる
 * - 採点はその場で行う（問題が正解を持っている）。時間切れの届け出は
 *   模試に制限時間が無いので受け取らない
 * - 許可されなければ問題は作らず、`gate` が `blocked` になる。ペイウォールを
 *   出すのはビュー（盤面の外）で、このホックは問題を空のまま保つ
 *
 * @design ビューに置く
 *
 * ゲートの状態を盤面ではなくビューが持つのは、上限で止まったとき盤面ごと
 * ペイウォールに置き換えるため。盤面の中に出すと、模試のシェル（見出し・
 * カウンタ・本番への導線）の中にペイウォールが入る。ビューに置けば
 * ペイウォールの間もこのフックは生きていて、アプリの「前面に戻ったら
 * 聞き直す」（`usePracticeQuota` のフォーカス）もそのまま効く。
 *
 * @param generate - 問題を 1 問作る。成立しなければ undefined（盤面は
 *   生成待ちのまま）。参照が変わっても最新のものを呼ぶ
 * @param useQuota - プラットフォームの回数制限のゲート。呼び出し側で
 *   練習（回数制限の単位）を束ねておく
 */
export function useQuotaQuestionHost(
  generate: () => unknown,
  useQuota: UsePracticeQuota,
): QuotaQuestionHost {
  const [question, setQuestion] = useState<unknown>(undefined);
  const quota = useQuota(() => setQuestion(generate()));
  const { requestQuestion, requestFirstQuestion, gate, isChecking } = quota;
  // 開いた直後の 1 問を聞くまでは直前の模試のゲート（ペイウォール等）を
  // 見せない。消すのは最初の問いの中（`requestFirstQuestion`）で、それより
  // 前の描画が古い `blocked` を読んでペイウォールを一瞬出さないため
  const [started, setStarted] = useState(false);
  // 開発の StrictMode は effect を 2 回走らせる。2 回聞くと無料枠が 2 つ減るので
  // 1 回に抑える（ref は StrictMode の再実行でも保たれる）
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void requestFirstQuestion();
    setStarted(true);
  }, [requestFirstQuestion]);

  const advance = useCallback(() => {
    setQuestion(undefined);
    void requestQuestion();
  }, [requestQuestion]);

  const grade = useCallback<QuestionHost["grade"]>(
    (_answer, onGraded) => {
      if (question === undefined) return false;
      onGraded(question);
      return true;
    },
    [question],
  );

  const host = useMemo<QuestionHost>(
    () => ({
      question,
      advance,
      grade,
      registerUnanswered: () => {},
    }),
    [question, advance, grade],
  );

  return { host, gate: started ? gate : undefined, isChecking };
}

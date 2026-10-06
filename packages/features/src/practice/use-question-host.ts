"use client";

import {
  createContext,
  createElement,
  useContext,
  type ReactNode,
} from "react";

/**
 * 出題と採点を盤面の外に委ねる提供元（ホスト）
 * 出題ホスト
 *
 * 盤面のフック（出題・採点・届け出）は、ホストが無ければ自分で問題を作り
 * その場で採点する。web の記録ありのチャレンジだけがホスト（サーバー採点）を
 * 提供し、問題はサーバーが出し、回答はサーバーへ送って採点を待つ。
 * モバイルとトレーニングはホストを持たない。
 *
 * 問題はメニューを問わない形（unknown）で受け渡す。盤面の型へ当てはめるのは
 * {@link asHostedQuestion} だけで行う。
 */
export interface QuestionHost {
  /** ホストが出している問題 */
  readonly question: unknown;
  /** 次の問題へ進める */
  readonly advance: () => void;
  /**
   * 回答を採点に回す。受け付けたら true、通信中・時間切れ後などで
   * 受け付けなかったら false。採点が済むと採点済みの問題で `onGraded` を呼ぶ
   */
  readonly grade: (
    answer: unknown,
    onGraded: (question: unknown) => void,
  ) => boolean;
  /**
   * 時間切れで答えられなかった問題の受け取り先を登録する
   *
   * ホストは時間切れの時点で出ていた問題を知っているため、盤面が自分で
   * 届け出る代わりにこれで受け取る。
   */
  readonly registerUnanswered: (
    callback: ((question: unknown) => void) | undefined,
  ) => void;
}

const QuestionHostContext = createContext<QuestionHost | undefined>(undefined);

/**
 * 盤面に出題ホストをつなぐ
 * 出題ホスト提供
 */
export function QuestionHostProvider({
  value,
  children,
}: {
  readonly value: QuestionHost;
  readonly children: ReactNode;
}) {
  // features は .ts だけを書き出すため JSX を使わない
  return createElement(QuestionHostContext.Provider, { value }, children);
}

/**
 * 出題ホストを読む（無ければ undefined）
 * 出題ホスト参照
 */
export function useQuestionHost(): QuestionHost | undefined {
  return useContext(QuestionHostContext);
}

/**
 * ホストの問題を盤面のメニュー固有の型として扱う唯一の境界
 * 問題の型変換境界
 *
 * ホストは全メニューの和で問題を返すが、盤面は自分のメニューの型しか知らない。
 * ホストが同じメニューの問題だけを返すこと（web では `attempts.ts`）を前提に、
 * ここだけで型を当てはめる。ここ以外で問題を型変換しないこと。
 */
export function asHostedQuestion<TQuestion>(question: unknown): TQuestion {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- ホストが同一メニューの問題だけを返す前提をここ 1 箇所で型に写す（上の TSDoc 参照）
  return question as TQuestion;
}

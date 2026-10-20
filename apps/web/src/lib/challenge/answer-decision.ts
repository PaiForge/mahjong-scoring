import { isDeepStrictEqual } from "node:util";

import type {
  ChallengeQuestion,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";

import {
  askedChallengeQuestions,
  generateChallengeQuestion,
  gradeChallengeAnswer,
  publicChallengeQuestion,
} from "./questions";
import {
  answeredChallenge,
  canAnswerChallenge,
  isChallengeTimeUp,
} from "./transitions";

/**
 * 回答を受け付けたときの応答
 * 回答応答
 *
 * 採点した問題（正解込み）と、次の問題（正解を伏せたもの）、採点時点の
 * 経過時間を返す。画面はこの経過時間に時計を合わせ直す。
 */
export interface AnswerResponse {
  readonly correct: boolean;
  readonly answered: ChallengeQuestion;
  readonly question: ChallengeQuestion;
  readonly sequence: number;
  readonly elapsedMs: number;
}

/**
 * 回答をどう扱うか
 * 回答の判定
 *
 * - `replay` — 直前の問題への同じ回答の再送。採点し直さず、受け付けたときと
 *   同じ応答を組み直して返す（行は変えない）
 * - `rejected` — 受け付けない。古い番号への別の回答・確定済み・早押し・
 *   停止中・期限切れ・ミス上限後・目標到達後・次問を作れなかった
 * - `expired` — 制限時間を使い切っている。画面に時間切れを知らせる
 * - `accepted` — 採点して次の問題へ進めた。`state` を行に書き、
 *   `response` を返す
 */
export type AnswerDecision =
  | { readonly kind: "replay"; readonly response: AnswerResponse }
  | { readonly kind: "rejected" }
  | { readonly kind: "expired" }
  | {
      readonly kind: "accepted";
      readonly state: ChallengeState;
      readonly response: AnswerResponse;
    };

/**
 * 回答を JSON に直した形
 *
 * 回答は jsonb に入って戻ってくる。値が undefined のキーは JSON に載らず
 * jsonb で消えるので、比べる前に両方をこの形に揃える。
 */
function toJsonValue(value: unknown): unknown {
  return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

/**
 * ロックして読んだ挑戦の行に対して、回答をどう扱うかを決める
 * 回答判定
 *
 * DB に触れない純粋な判定。`answerAttempt` は行のロックと、`accepted` の
 * `state` の UPDATE だけを持つ。再送・差し替え・期限切れ・採点の規則を
 * DB 無しで検証できるようにするため。
 *
 * 直前の問題への再送は、採点し直さずに受け付けたときと同じ応答を返す。
 * 応答が通信で失われると、クライアントは次の問題を知らないまま同じ番号で
 * 送り直すしかないため。同じ番号に別の回答が来たら拒否する（答えを
 * 見てからの差し替えになる）。再送の判定は確定済みの行にも効く
 * （確定の直前の回答の応答を取り直せる）。
 *
 * @param row - ロックして読んだ行の状態と確定済みか
 * @param sequence - 回答した問題の番号
 * @param answer - クライアントの回答（検証前）
 * @param receivedAt - 回答のリクエストを受け取った時刻
 * @param clock - 時計。応答の起点（`respondedAt`）を採点の後に読むので、
 *   時刻ではなく関数で受ける。読んだ直後に UPDATE するのが呼び出し側の約束
 */
export function decideChallengeAnswer(
  row: { readonly state: ChallengeState; readonly consumed: boolean },
  sequence: number,
  answer: unknown,
  receivedAt: number,
  clock: () => number,
): AnswerDecision {
  const { state } = row;
  const last = state.lastAnswer;
  if (last && last.sequence === sequence) {
    if (!isDeepStrictEqual(last.answer, toJsonValue(answer)))
      return { kind: "rejected" };
    return {
      kind: "replay",
      response: {
        correct: last.correct,
        answered: last.answered,
        question: publicChallengeQuestion(state.question, state.menuType),
        sequence: state.sequence,
        elapsedMs: last.elapsedMs,
      },
    };
  }
  if (row.consumed) return { kind: "rejected" };
  if (isChallengeTimeUp(state, receivedAt)) return { kind: "expired" };
  if (!canAnswerChallenge(state, sequence, receivedAt))
    return { kind: "rejected" };
  const correct = gradeChallengeAnswer(state.menuType, state.question, answer);
  const askedQuestions = askedChallengeQuestions(state);
  const next = generateChallengeQuestion(
    state.menuType,
    state.variant,
    state.settings,
    askedQuestions,
  );
  if (!next) return { kind: "rejected" };
  const answered = answeredChallenge(state, correct, next, receivedAt, clock());
  const nextState: ChallengeState = {
    ...answered,
    ...(askedQuestions && { askedQuestions }),
    lastAnswer: {
      sequence,
      answer: toJsonValue(answer),
      correct,
      answered: state.question,
      elapsedMs: answered.elapsedMs,
    },
  };
  return {
    kind: "accepted",
    state: nextState,
    response: {
      correct,
      answered: state.question,
      question: publicChallengeQuestion(next, nextState.menuType),
      sequence: nextState.sequence,
      // 採点時点の経過時間。画面の時計をこれに合わせ直す（猶予の間は止まっている）
      elapsedMs: nextState.elapsedMs,
    },
  };
}

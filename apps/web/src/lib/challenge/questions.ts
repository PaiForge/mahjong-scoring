import "server-only";

import {
  clampHanToYakuman,
  judgeScoreTableAnswer,
} from "@mahjong-scoring/core";
import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";
import { scoreTableAnswerSchema } from "@mahjong-scoring/features/results/result-schemas";
import type {
  ChallengeQuestion,
  ChallengeSettings,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";
import { CHALLENGE_QUESTION_GENERATORS } from "./generators";

/**
 * 次問の生成に渡す出題履歴（今の問題までを含む）
 *
 * 同じ問題を続けて出さない出題（役翻数）だけが履歴を持つ。それ以外は
 * undefined を返し、挑戦の行にも積まない。
 */
export function askedChallengeQuestions(
  state: Pick<ChallengeState, "menuType" | "question" | "askedQuestions">,
): readonly ChallengeQuestion[] | undefined {
  if (state.menuType !== "yaku_han") return undefined;
  return [...(state.askedQuestions ?? []), state.question];
}

/**
 * 記録対象の問題をサーバーで生成する。出題条件はメニューから決める。
 *
 * @param asked - この挑戦で既に出した問題（{@link askedChallengeQuestions}）
 */
export function generateChallengeQuestion(
  menu: PracticeMenuType,
  variant: string,
  settings: ChallengeSettings,
  asked: readonly ChallengeQuestion[] = [],
): ChallengeQuestion | undefined {
  return CHALLENGE_QUESTION_GENERATORS[menu]({ variant, settings, asked });
}

/**
 * 回答は選択値のみ受け取り、サーバーに保管した正解と比較する。
 *
 * 問題の形（選択肢・符の項目列・役名の集合・翻数・点数）ごとに採点を分ける。
 * 形はフィールドの有無で見分ける（問題は JSON で行に保管され、型の印を持たない）。
 */
export function gradeChallengeAnswer(
  menu: PracticeMenuType,
  question: ChallengeQuestion,
  answer: unknown,
): boolean {
  if ("choices" in question) return gradeChoice(question.choices, answer);
  if ("items" in question) return gradeFuItems(question.items, answer);
  if ("correctYakuNames" in question)
    return gradeYakuNames(question.correctYakuNames, answer);
  if ("correctHan" in question) return answer === question.correctHan;
  if ("answer" in question && typeof question.answer === "number")
    return answer === question.answer;
  if (
    "answer" in question &&
    typeof question.answer === "object" &&
    menu === "han_count"
  )
    return answer === clampHanToYakuman(question.answer.han);
  return gradeScoreTable(question, answer);
}

/** 選択肢の番号で答える問題（雀頭符・面子符・待ち符・役翻数の一部） */
function gradeChoice(
  choices: readonly { readonly isCorrect: boolean }[],
  answer: unknown,
): boolean {
  return typeof answer === "number" && choices[answer]?.isCorrect === true;
}

/** 項目ごとの符を順に答える問題（面子と雀頭の符）。長さと各項目の一致 */
function gradeFuItems(
  items: readonly { readonly fu: number }[],
  answer: unknown,
): boolean {
  return (
    Array.isArray(answer) &&
    answer.length === items.length &&
    items.every((item, i) => answer[i] === item.fu)
  );
}

/** 成立する役の集合を答える問題。重複を認めず、過不足なく一致したときだけ正解 */
function gradeYakuNames(
  correctYakuNames: readonly string[],
  answer: unknown,
): boolean {
  return (
    Array.isArray(answer) &&
    answer.length === correctYakuNames.length &&
    new Set(answer).size === answer.length &&
    correctYakuNames.every((name) => answer.includes(name))
  );
}

/**
 * 点数（親子・ツモロンの支払い）を答える問題。点数表早引きは `correctAnswer`
 * を、点数計算は `answer.payment` を点数表の答えの形に直して比べる
 */
function gradeScoreTable(
  question: ChallengeQuestion,
  answer: unknown,
): boolean {
  const parsed = scoreTableAnswerSchema.safeParse(answer);
  if (!parsed.success) return false;
  if ("correctAnswer" in question)
    return judgeScoreTableAnswer(question.correctAnswer, parsed.data);
  if ("answer" in question && typeof question.answer === "object")
    return judgeScoreTableAnswer(
      paymentToScoreTableAnswer(question.answer.payment),
      parsed.data,
    );
  return false;
}

/**
 * 回答前の問題。既存の盤面が参照する答え欄は一定のダミーにし、正解は回答受付後のみ返す。
 * ダミーは採点に使わない。メニューが問題文として提示する役一覧だけは保持する。
 */
export function publicChallengeQuestion(
  question: ChallengeQuestion,
  menu: PracticeMenuType,
): ChallengeQuestion {
  if ("choices" in question)
    return {
      ...question,
      choices: question.choices.map((choice) => ({
        ...choice,
        isCorrect: false,
        fu: 0,
      })),
    };
  if ("items" in question)
    return {
      ...question,
      items: question.items.map((item) => ({ ...item, fu: 0 })),
    };
  if ("correctYakuNames" in question)
    return { ...question, correctYakuNames: [] };
  if ("correctHan" in question) return { ...question, correctHan: 0 };
  if ("correctAnswer" in question)
    return { ...question, correctAnswer: { type: "ron", score: 0 } };
  if (typeof question.answer === "number") {
    if ("fuDetails" in question)
      return { ...question, answer: 20, fuDetails: [] };
    return { ...question, answer: 20 };
  }
  return {
    ...question,
    answer: {
      han: 0,
      fu: 20,
      scoreLevel: "Normal",
      yakumanMultiplier: 0,
      payment: { type: "ron", amount: 0 },
    },
    fuDetails: [],
    yakuDetails:
      menu === "mangan_score_calculation" ? question.yakuDetails : [],
  };
}

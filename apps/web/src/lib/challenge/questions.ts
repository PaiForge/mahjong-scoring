import "server-only";

import {
  generateJantouFuQuestion,
  generateMachiFuQuestion,
  generateMentsuFuQuestion,
  generateMentsuJantouFuQuestion,
  generateTotalFuQuestion,
  generateYakuQuestion,
  generateYakuHanQuestion,
  generateScoreTableQuestion,
  generateValidScoreQuestion,
  retryGenerate,
  clampHanToYakuman,
  judgeScoreTableAnswer,
} from "@mahjong-scoring/core";
import type { PracticeMenuType } from "@mahjong-scoring/features/practice-menu-types";
import { resolvePracticeVariant } from "@mahjong-scoring/features/practice-menu-types";
import { SCORE_TABLE_VARIANT_OPTIONS } from "@mahjong-scoring/features/practice/score-table/variants";
import { YAKU_HAN_VARIANT_RANGES } from "@mahjong-scoring/features/practice/yaku-han/variants";
import { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";
import { scoreTableAnswerSchema } from "@mahjong-scoring/features/results/result-schemas";
import { EXAM_GENERATE_OPTIONS as mangan } from "@mahjong-scoring/features/exam/mangan/types";
import { EXAM_GENERATE_OPTIONS as fu } from "@mahjong-scoring/features/exam/fu/types";
import { EXAM_GENERATE_OPTIONS as chiitoitsu } from "@mahjong-scoring/features/exam/chiitoitsu/types";
import { EXAM_GENERATE_OPTIONS as pinfu } from "@mahjong-scoring/features/exam/pinfu/types";
import { EXAM_GENERATE_OPTIONS as fuScore } from "@mahjong-scoring/features/exam/fu-score/types";
import { EXAM_GENERATE_OPTIONS as score } from "@mahjong-scoring/features/exam/score/types";
import type { YakuHanQuestion } from "@mahjong-scoring/core";
import type {
  ChallengeQuestion,
  ChallengeSettings,
  ChallengeState,
} from "@mahjong-scoring/features/challenge/types";

function isYakuHanQuestion(
  question: ChallengeQuestion,
): question is YakuHanQuestion {
  return "yakuName" in question && "correctHan" in question;
}

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
  switch (menu) {
    case "jantou_fu":
      return generateJantouFuQuestion(settings);
    case "machi_fu":
      return generateMachiFuQuestion();
    case "mentsu_fu":
      return generateMentsuFuQuestion();
    case "mentsu_jantou_fu":
      return retryGenerate(() => generateMentsuJantouFuQuestion(settings), 100);
    case "total_fu":
      return retryGenerate(() => generateTotalFuQuestion(settings), 100);
    case "fu_exam":
      return retryGenerate(() => generateTotalFuQuestion(fu), 100);
    case "yaku":
      return retryGenerate(generateYakuQuestion, 100);
    case "yaku_han":
      return generateYakuHanQuestion(
        YAKU_HAN_VARIANT_RANGES[resolvePracticeVariant("yaku-han", variant)],
        asked.filter(isYakuHanQuestion),
      );
    case "score_table":
      return generateScoreTableQuestion({
        ...SCORE_TABLE_VARIANT_OPTIONS[
          resolvePracticeVariant("score-table", variant)
        ],
        excludeKiriageBoundary: true,
      });
    case "han_count":
      return generateValidScoreQuestion();
    case "mangan_exam":
      return generateValidScoreQuestion(mangan, 500);
    case "chiitoitsu_exam":
      return generateValidScoreQuestion(chiitoitsu, 500);
    case "pinfu_exam":
      return generateValidScoreQuestion(pinfu, 500);
    case "fu_score_exam":
      return generateValidScoreQuestion(fuScore, 500);
    case "score_exam":
      return generateValidScoreQuestion(score, 500);
    case "mangan_score_calculation":
      return generateValidScoreQuestion(
        { ...score, allowedRanges: ["manganPlus"] },
        500,
      );
    case "score_calculation":
      return generateValidScoreQuestion(score, 500);
    default: {
      const exhaustive: never = menu;
      return exhaustive;
    }
  }
}

/** 回答は選択値のみ受け取り、サーバーに保管した正解と比較する。 */
export function gradeChallengeAnswer(
  menu: PracticeMenuType,
  question: ChallengeQuestion,
  answer: unknown,
): boolean {
  if ("choices" in question)
    return (
      typeof answer === "number" && question.choices[answer]?.isCorrect === true
    );
  if ("items" in question)
    return (
      Array.isArray(answer) &&
      answer.length === question.items.length &&
      question.items.every((item, i) => answer[i] === item.fu)
    );
  if ("correctYakuNames" in question)
    return (
      Array.isArray(answer) &&
      answer.length === question.correctYakuNames.length &&
      new Set(answer).size === answer.length &&
      question.correctYakuNames.every((name) => answer.includes(name))
    );
  if ("correctHan" in question) return answer === question.correctHan;
  if ("answer" in question && typeof question.answer === "number")
    return answer === question.answer;
  if (
    "answer" in question &&
    typeof question.answer === "object" &&
    menu === "han_count"
  )
    return answer === clampHanToYakuman(question.answer.han);
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

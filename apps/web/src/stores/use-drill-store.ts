import { create } from "zustand";
import type {
  DrillQuestion,
  UserAnswer,
  JudgementResult,
  QuestionGeneratorOptions,
} from "@mahjong-scoring/core";
import { generateValidQuestion, judgeAnswer } from "@mahjong-scoring/core";

interface DrillState {
  /** 現在の問題 */
  currentQuestion: DrillQuestion | undefined;
  /** ユーザーの回答 */
  userAnswer: UserAnswer | undefined;
  /** 判定結果 */
  judgementResult: JudgementResult | undefined;
  /** 回答済みかどうか */
  isAnswered: boolean;
  /** 問題生成オプション */
  options: QuestionGeneratorOptions;
  /** 統計 */
  stats: {
    total: number;
    correct: number;
  };
}

interface DrillActions {
  /** 新しい問題を生成 */
  generateNewQuestion: () => void;
  /** 回答を送信 */
  submitAnswer: (
    answer: UserAnswer,
    requireYaku?: boolean,
    simplifyMangan?: boolean,
    requireFuForMangan?: boolean,
  ) => void;
  /** 次の問題へ */
  nextQuestion: () => void;
  /** 統計をリセット */
  resetStats: () => void;
  /** オプションを更新 */
  setOptions: (options: Partial<QuestionGeneratorOptions>) => void;
  /** 問題を直接設定 */
  setQuestion: (question: DrillQuestion | undefined) => void;
}

type DrillStore = DrillState & DrillActions;

/**
 * 点数計算ドリルのストア
 * ドリルストア
 */
export const useDrillStore = create<DrillStore>((set, get) => ({
  currentQuestion: undefined,
  userAnswer: undefined,
  judgementResult: undefined,
  isAnswered: false,
  options: {
    includeFuro: true,
    includeChiitoi: false,
    allowedRanges: ["non_mangan", "mangan_plus"],
  },
  stats: {
    total: 0,
    correct: 0,
  },

  generateNewQuestion: () => {
    const { options } = get();
    const question = generateValidQuestion(options);
    set({
      currentQuestion: question,
      userAnswer: undefined,
      judgementResult: undefined,
      isAnswered: false,
    });
  },

  submitAnswer: (
    answer: UserAnswer,
    requireYaku = false,
    simplifyMangan = false,
    requireFuForMangan = false,
  ) => {
    const { currentQuestion, stats } = get();
    if (!currentQuestion) return;

    const result = judgeAnswer(
      currentQuestion,
      answer,
      requireYaku,
      simplifyMangan,
      requireFuForMangan,
    );

    set({
      userAnswer: answer,
      judgementResult: result,
      isAnswered: true,
      stats: {
        total: stats.total + 1,
        correct: stats.correct + (result.isCorrect ? 1 : 0),
      },
    });
  },

  nextQuestion: () => {
    get().generateNewQuestion();
  },

  resetStats: () => {
    set({
      stats: {
        total: 0,
        correct: 0,
      },
    });
  },

  setOptions: (options: Partial<QuestionGeneratorOptions>) => {
    set((state) => ({
      options: {
        ...state.options,
        ...options,
      },
    }));
  },

  setQuestion: (question: DrillQuestion | undefined) => {
    set({
      currentQuestion: question,
      userAnswer: undefined,
      judgementResult: undefined,
      isAnswered: false,
    });
  },
}));

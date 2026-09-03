import { create } from "zustand";
import type {
  ScoreQuestion,
  UserAnswer,
  JudgementResult,
  QuestionGeneratorOptions,
} from "@mahjong-scoring/core";
import {
  allowsDoubleYakuman,
  generateValidScoreQuestion,
  judgeAnswer,
  toYakumanRuleConfig,
} from "@mahjong-scoring/core";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";

interface ScorePracticeState {
  /** 現在の問題 */
  currentQuestion: ScoreQuestion | undefined;
  /** ユーザーの回答 */
  userAnswer: UserAnswer | undefined;
  /** 判定結果 */
  judgementResult: JudgementResult | undefined;
  /** 回答済みかどうか */
  isAnswered: boolean;
  /**
   * 直近の生成が問題を作れずに終わったか。
   * 生成失敗フラグ
   *
   * `generateValidScoreQuestion` はリトライを使い切ると undefined を返す。
   * 盤面は「問題が無い」を生成前（スケルトン）としか解釈しないため、
   * このフラグ無しでは失敗時にスケルトンのまま固まり、終了導線も出ない。
   * 出題条件を絞れるほど（役の指定等）この経路は現実に踏まれる。
   */
  generationFailed: boolean;
  /** 出題ごとに増える連番。回答フォームの key に使い、次問題への遷移で入力をクリアする */
  questionSeq: number;
  /** 問題生成オプション */
  options: QuestionGeneratorOptions;
  /** 統計 */
  stats: {
    total: number;
    correct: number;
  };
}

interface ScorePracticeActions {
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
  /**
   * 無回答のまま正解を開示する（「わからない」）
   *
   * 回答ではないため統計（total / correct）には含めない。
   * 開示後は回答時と同じ結果表示から「次の問題へ」で進む。
   */
  revealAnswer: () => void;
  /** 統計をリセット */
  resetStats: () => void;
  /** オプションを更新 */
  setOptions: (options: Partial<QuestionGeneratorOptions>) => void;
  /** 問題を直接設定 */
  setQuestion: (question: ScoreQuestion | undefined) => void;
}

type ScorePracticeStore = ScorePracticeState & ScorePracticeActions;

/**
 * 点数計算練習のストア
 * 点数練習ストア
 */
export const useScorePracticeStore = create<ScorePracticeStore>((set, get) => ({
  currentQuestion: undefined,
  userAnswer: undefined,
  judgementResult: undefined,
  isAnswered: false,
  generationFailed: false,
  questionSeq: 0,
  options: {
    includeFuro: true,
    includeChiitoi: false,
    allowedRanges: ["nonMangan", "manganPlus"],
  },
  stats: {
    total: 0,
    correct: 0,
  },

  generateNewQuestion: () => {
    const { options } = get();
    const { renfonpaiAs4Fu, kiriageMangan } = useRuleSettingsStore.getState();
    const question = generateValidScoreQuestion(
      {
        ...options,
        renfonpaiAs4Fu,
        kiriageMangan,
        yakumanRules: toYakumanRuleConfig(useRuleSettingsStore.getState()),
      },
      // 既定の100回では、役の絞り込み（requiredYaku）で出現率2%の役を
      // 指定したとき約13%の確率で取り逃す。500回なら0.004%（1回0.08ms実測
      // なので最悪でも40ms）。allowlist の根拠は core の filterable-yaku.ts
      500,
    );
    set((state) => ({
      currentQuestion: question,
      userAnswer: undefined,
      judgementResult: undefined,
      isAnswered: false,
      generationFailed: question === undefined,
      questionSeq: state.questionSeq + 1,
    }));
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
      // ダブル役満採用時は 26 翻を役満へ丸めずに別の答えとして判定する
      allowsDoubleYakuman(toYakumanRuleConfig(useRuleSettingsStore.getState())),
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

  revealAnswer: () => {
    const { currentQuestion, isAnswered } = get();
    if (!currentQuestion || isAnswered) return;
    set({
      userAnswer: undefined,
      judgementResult: undefined,
      isAnswered: true,
    });
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

  setQuestion: (question: ScoreQuestion | undefined) => {
    set((state) => ({
      currentQuestion: question,
      userAnswer: undefined,
      judgementResult: undefined,
      isAnswered: false,
      // 設定画面へ戻る前のクリア（setQuestion(undefined)）は失敗ではない
      generationFailed: false,
      questionSeq: state.questionSeq + 1,
    }));
  },
}));
